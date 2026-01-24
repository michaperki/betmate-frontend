import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { fetchGamesByStatus } from 'store/actionCreators/gameActionCreators';
import { fetchWagerHistory, fetchUserBettingStats } from 'store/actionCreators/wagerActionCreators';
import { getBalanceHistory } from 'store/actionCreators/authActionCreators';
import { getLeaderboardHead } from 'store/actionCreators/leaderboardActionCreators';
import { getFeaturedMatch } from 'store/requests/matchesRequests';
import { Game } from 'types/resources/game';
import { useMode } from 'context/ModeContext';
import { fetchGameStats } from 'store/actionCreators/gameActionCreators';

type LiveMatchCard = {
  id: string;
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  timeWhite: string;
  timeBlack: string;
  move: number;
  phase: 'Opening' | 'Midgame' | 'Endgame';
  format: string; // e.g., "10+0 • Rapid"
  source: string; // e.g., "Lichess"
  viewers: number;
  totalPool?: number; // optional, when available
  featured: boolean;
};

type RecentBetItem = {
  type: string;
  odds: number;
  amount: number;
  result: 'won' | 'lost' | 'cancelled';
  profit: number;
  currency: 'USDT' | 'BET';
};

type LeaderboardItem = {
  rank: number;
  name: string;
  net: number;
  winRate?: number;
  avatar?: string;
  isYou?: boolean;
};

export function useNewDashboardData() {
  const dispatch = useDispatch();
  const { mode } = useMode();

  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const user = useSelector((s: RootState) => s.auth.user);
  const balanceHistory = useSelector((s: RootState) => s.auth.balanceHistory);
  const gamesMap = useSelector((s: RootState) => s.game.games);
  const gameStats = useSelector((s: RootState) => s.game.gameStats);
  const wagerHistory = useSelector((s: RootState) => s.wager.wagerHistory);
  const wagerStats = useSelector((s: RootState) => s.wager.stats);
  const leaderboardRanks = useSelector((s: RootState) => s.leaderboard.rankings);

  const [featuredId, setFeaturedId] = useState<string | null>(null);

  // Kick off data fetches on mount
  useEffect(() => {
    try { dispatch(fetchGamesByStatus(['not_started', 'in_progress'])); } catch {}
    try { dispatch(getLeaderboardHead()); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Periodically refresh live/in-progress games to keep list fresh
  useEffect(() => {
    const iv = window.setInterval(() => {
      try { dispatch(fetchGamesByStatus(['not_started', 'in_progress'])); } catch {}
      try { dispatch(getLeaderboardHead()); } catch {}
    }, 15000);
    return () => window.clearInterval(iv);
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getFeaturedMatch();
        if (mounted && resp?.data?.match_id) setFeaturedId(String(resp.data.match_id));
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Auth-scoped fetches
  useEffect(() => {
    if (!isAuthenticated) return;
    try { dispatch(fetchWagerHistory(undefined, 50, 0)); } catch {}
    try { dispatch(fetchUserBettingStats()); } catch {}
    try { dispatch(getBalanceHistory(30, mode === 'real' ? 'USDT' : 'BET')); } catch {}
  }, [dispatch, isAuthenticated, mode]);

  // Normalize raw time (ms or s) to whole seconds
  const toSeconds = (raw?: number, timeFormat?: string): number => {
    const n = Math.max(0, Number(raw || 0));
    const parseInitialSeconds = (tf?: string): number | null => {
      if (!tf) return null;
      const base = String(tf).split('+')[0]?.trim();
      const mins = Number.parseInt(base, 10);
      return Number.isFinite(mins) && mins >= 0 ? mins * 60 : null;
    };
    const initialSecs = parseInitialSeconds(timeFormat);
    if (initialSecs != null) return n > initialSecs * 10 ? Math.floor(n / 1000) : Math.floor(n);
    return n > 10000 ? Math.floor(n / 1000) : Math.floor(n);
  };
  const toClock = (secs?: number): string => {
    const s = Math.max(0, Math.floor(Number(secs || 0)));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  // Local ticking clocks per live game id
  const [clocks, setClocks] = useState<Record<string, { white: number; black: number; side: 'white'|'black' }>>({});

  const toFormat = (tf?: string): string => {
    const t = String(tf || '').trim();
    if (!t.includes('+')) return t || '—';
    const [a, b] = t.split('+');
    const base = Number(a);
    const inc = Number(b);
    // If value seems like seconds (>= 60), convert to minutes
    const mins = Number.isFinite(base) ? (base >= 60 ? Math.round(base / 60) : base) : a;
    let speed = 'Rapid';
    const minutes = Number(mins);
    if (Number.isFinite(minutes)) {
      if (minutes <= 2) speed = 'Bullet';
      else if (minutes <= 5) speed = 'Blitz';
      else if (minutes <= 15) speed = 'Rapid';
      else speed = 'Classical';
    }
    return `${mins}+${Number.isFinite(inc) ? inc : b} • ${speed}`;
  };

  const phaseFor = (moveCount: number): 'Opening' | 'Midgame' | 'Endgame' => {
    if (moveCount < 12) return 'Opening';
    if (moveCount < 30) return 'Midgame';
    return 'Endgame';
  };

  const liveMatches: LiveMatchCard[] = useMemo(() => {
    const list = Object.values(gamesMap || {}) as Game[];
    if (!list.length) return [];
    const filtered = list.filter(g => (g.game_status === 'not_started' || g.game_status === 'in_progress'));
    const items = filtered.map((g, idx) => {
      const move = Array.isArray(g.move_hist) ? g.move_hist.length : 0;
      const stats = gameStats[g._id];
      const totalMovePool = (() => {
        try {
          return (g.pool_wagers?.move?.wagers || []).reduce((s, w) => s + (Number(w.amount) || 0), 0);
        } catch { return 0; }
      })();
      // Use local ticking clocks when available; otherwise derive from raw
      const entry = clocks[g._id];
      const whiteSecs = entry ? entry.white : toSeconds(g.time_white, g.time_format);
      const blackSecs = entry ? entry.black : toSeconds(g.time_black, g.time_format);
      return {
        id: g._id,
        white: { name: g.player_white?.name, rating: g.player_white?.elo },
        black: { name: g.player_black?.name, rating: g.player_black?.elo },
        timeWhite: toClock(whiteSecs),
        timeBlack: toClock(blackSecs),
        move,
        phase: phaseFor(move),
        format: toFormat(g.time_format),
        source: 'Lichess',
        viewers: stats?.viewerCount ?? 0,
        totalPool: totalMovePool > 0 ? Math.round(totalMovePool * 100) / 100 : undefined,
        featured: featuredId ? (String(featuredId) === String(g._id)) : (idx === 0),
      } as LiveMatchCard;
    });
    // Keep featured match first
    items.sort((a, b) => (a.featured === b.featured) ? 0 : (a.featured ? -1 : 1));
    return items;
  }, [gamesMap, gameStats, featuredId, clocks]);

  // Poll viewer counts for live matches (lightweight stats fetch)
  useEffect(() => {
    if (!liveMatches || liveMatches.length === 0) return;
    const iv = window.setInterval(() => {
      const ids = liveMatches.slice(0, 12).map(m => m.id); // cap to first 12
      for (const id of ids) {
        try { dispatch(fetchGameStats(id)); } catch {}
      }
    }, 8000);
    return () => window.clearInterval(iv);
  }, [dispatch, liveMatches.map(m => m.id).join(',')]);

  // Sync local clock state with store updates (initialize/reset)
  useEffect(() => {
    const list = Object.values(gamesMap || {}) as Game[];
    const filtered = list.filter(g => (g.game_status === 'not_started' || g.game_status === 'in_progress'));
    if (!filtered.length) {
      setClocks({});
      return;
    }
    setClocks((prev) => {
      const next: Record<string, { white: number; black: number; side: 'white'|'black' }> = {};
      for (const g of filtered) {
        const white = toSeconds(g.time_white, g.time_format);
        const black = toSeconds(g.time_black, g.time_format);
        let side: 'white'|'black' = 'white';
        try { side = (new Chess(g.state).turn() === 'w') ? 'white' : 'black'; } catch {
          const mv = Array.isArray(g.move_hist) ? g.move_hist.length : 0;
          side = (mv % 2 === 0) ? 'white' : 'black';
        }
        const prevEntry = prev[g._id];
        // If times changed or side changed, reset entry; else keep ticking values
        if (!prevEntry || prevEntry.white !== white || prevEntry.black !== black || prevEntry.side !== side) {
          next[g._id] = { white, black, side };
        } else {
          next[g._id] = prevEntry;
        }
      }
      return next;
    });
  }, [gamesMap]);

  // Tick active side for each live match once per second
  useEffect(() => {
    const id = window.setInterval(() => {
      setClocks((prev) => {
        const out: typeof prev = {};
        for (const [gid, entry] of Object.entries(prev)) {
          const { side } = entry;
          if (side === 'white') out[gid] = { ...entry, white: Math.max(0, (entry.white || 0) - 1) };
          else out[gid] = { ...entry, black: Math.max(0, (entry.black || 0) - 1) };
        }
        return out;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const recentBets: RecentBetItem[] = useMemo(() => {
    if (!Array.isArray(wagerHistory) || wagerHistory.length === 0) return [];
    const mapOutcome = (d: string) => ({ white_win: 'White Win', black_win: 'Black Win', draw: 'Draw' }[d] || d);
    return wagerHistory.slice(0, 4).map((w: any) => {
      const isWdl = !!(w.wdl || w.wdl === true);
      const type = isWdl ? mapOutcome(String(w.data)) : `Move ${String(w.data)}`;
      const currency: 'USDT' | 'BET' = w.currency || ((w.mode === 'real') ? 'USDT' : 'BET');
      let result: 'won' | 'lost' | 'cancelled' = 'cancelled';
      if (w.status === 'won' || w.status === 'WON') result = 'won';
      else if (w.status === 'lost' || w.status === 'LOST') result = 'lost';
      else result = 'cancelled';
      const amount = Number(w.amount) || 0;
      const odds = Number(w.odds) || 1;
      const profit = result === 'won' ? (amount * odds - amount) : (result === 'lost' ? -amount : 0);
      return { type, odds, amount, result, profit, currency };
    });
  }, [wagerHistory]);

  const leaderboardTop5: LeaderboardItem[] = useMemo(() => {
    if (!leaderboardRanks || leaderboardRanks.length === 0) return [];
    return leaderboardRanks.slice(0, 5).map((r) => ({
      rank: r.rank,
      name: r.user_name,
      net: Number(r.winnings) || 0,
      isYou: user ? String(r.user_id) === String(user._id) : false,
    }));
  }, [leaderboardRanks, user]);

  const totalWagers = Number(wagerStats?.totalWagers || 0);
  const winRate = Number(wagerStats?.winRate || 0);
  const approxWins = Math.round((totalWagers * (winRate / 100)) || 0);

  // Compute Net P&L from balance history (prefer last 7 days delta)
  const { netPL, netPLPeriodLabel } = useMemo(() => {
    const hist = Array.isArray(balanceHistory) ? balanceHistory.slice().reverse() : [];
    if (hist.length < 2) return { netPL: 0, netPLPeriodLabel: 'this week' };
    const last7 = hist.slice(-7);
    const arr = last7.length >= 2 ? last7 : hist.slice(-Math.min(14, hist.length));
    const start = arr[0]?.balance ?? 0;
    const end = arr[arr.length - 1]?.balance ?? 0;
    return { netPL: Math.round((end - start) * 100) / 100, netPLPeriodLabel: last7.length >= 2 ? 'this week' : 'last period' };
  }, [balanceHistory]);

  const quickStats = useMemo(() => {
    if (!Array.isArray(wagerHistory) || wagerHistory.length === 0) {
      return { totalWagered: 0, avgBetSize: 0, bestWin: 0, favorite: 'Move' as 'Move' | 'WDL' };
    }
    const totalWagered = wagerHistory.reduce((s: number, w: any) => s + (Number(w.amount) || 0), 0);
    const avgBetSize = totalWagered / Math.max(1, wagerHistory.length);
    const bestWin = wagerHistory.reduce((m: number, w: any) => {
      if (w.status === 'won' || w.status === 'WON') {
        const amt = Number(w.amount) || 0;
        const odds = Number(w.odds) || 1;
        const net = amt * odds - amt;
        return Math.max(m, net);
      }
      return m;
    }, 0);
    const moveCount = wagerHistory.filter((w: any) => !w.wdl && w.wdl !== true).length;
    const wdlCount = wagerHistory.length - moveCount;
    return {
      totalWagered: Math.round(totalWagered * 100) / 100,
      avgBetSize: Math.round(avgBetSize * 100) / 100,
      bestWin: Math.round(bestWin * 100) / 100,
      favorite: moveCount >= wdlCount ? 'Move' : 'WDL' as 'Move' | 'WDL',
    };
  }, [wagerHistory]);

  const userName = user?.first_name || 'Player';
  const wallet = { usdt: user?.cash_balance ?? 0, bet: user?.token_balance ?? 0 };

  return {
    userName,
    wallet,
    liveMatches,
    recentBets,
    leaderboardTop5,
    winRate,
    totalWagers,
    approxWins,
    netPL,
    netPLPeriodLabel,
    quickStats,
  };
}

export type UseNewDashboardData = ReturnType<typeof useNewDashboardData>;
