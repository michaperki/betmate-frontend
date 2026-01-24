import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { fetchActiveWagers, fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import { fetchGamesByStatus } from 'store/actionCreators/gameActionCreators';
import { Wager, WagerStatus } from 'types/resources/wager';

const outcomeMap: Record<string, string> = { white_win: 'White Win', black_win: 'Black Win', draw: 'Draw' };

export function useNewMyBetsData() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const active = useSelector((s: RootState) => s.wager.activeWagers);
  const history = useSelector((s: RootState) => s.wager.wagerHistory);
  const games = useSelector((s: RootState) => s.game.games);

  useEffect(() => {
    if (!isAuthenticated) return;
    try { dispatch(fetchActiveWagers()); } catch {}
    try { dispatch(fetchWagerHistory(undefined, 100, 0)); } catch {}
    try { dispatch(fetchGamesByStatus(['not_started','in_progress'])); } catch {}
  }, [dispatch, isAuthenticated]);

  const activeBets = useMemo(() => {
    return (active || []).map((w: Wager) => {
      const g = games[w.game_id];
      const betType = w.wdl ? (outcomeMap[String(w.data)] || String(w.data)) : `Move ${String(w.data)}`;
      const category: 'outcome' | 'move' = w.wdl ? 'outcome' : 'move';
      const stake = Number(w.amount) || 0;
      const odds = Number(w.odds) || 1;
      const potentialWin = Math.round(stake * odds * 100) / 100;
      const placedAt = w.created_at || '';
      const move = (Array.isArray(g?.move_hist) ? g!.move_hist.length : (w.move_number || 0));
      const phase = move < 12 ? 'Opening' : (move < 30 ? 'Midgame' : 'Endgame');
      return {
        id: w._id,
        match: g ? { white: g.player_white?.name, black: g.player_black?.name, whiteRating: g.player_white?.elo, blackRating: g.player_black?.elo } : { white: '', black: '', whiteRating: 0, blackRating: 0 },
        betType,
        category,
        odds,
        stake,
        potentialWin,
        currentOdds: odds,
        cashoutValue: undefined as number | undefined,
        placedAt,
        move,
        phase,
        evaluation: null as number | null,
        status: 'pending' as 'pending' | 'winning' | 'losing',
      };
    });
  }, [active, games]);

  const betHistory = useMemo(() => {
    return (history || []).map((w: Wager) => {
      const g = games[w.game_id];
      const matchName = g ? `${g.player_white?.name} vs ${g.player_black?.name}` : String(w.game_id);
      const betType = w.wdl ? (outcomeMap[String(w.data)] || String(w.data)) : `Move ${String(w.data)}`;
      const stake = Number(w.amount) || 0;
      const odds = Number(w.odds) || 1;
      let profit = 0;
      if (w.status === WagerStatus.WON) profit = stake * odds - stake;
      if (w.status === WagerStatus.LOST) profit = -stake;
      return {
        id: w._id,
        match: matchName,
        betType,
        odds,
        stake,
        result: w.status === WagerStatus.WON ? 'won' : (w.status === WagerStatus.LOST ? 'lost' : 'cancelled'),
        profit: Math.round(profit * 100) / 100,
        date: w.created_at,
      };
    });
  }, [history, games]);

  // quick summary
  const quick = useMemo(() => {
    const today = 0; const week = 0; const month = 0; // left as placeholders
    const wins = (history || []).filter(w => w.status === WagerStatus.WON).length;
    const losses = (history || []).filter(w => w.status === WagerStatus.LOST).length;
    const total = (history || []).length;
    const avgOdds = (history || []).reduce((s, w) => s + (w.odds || 0), 0) / Math.max(1, total);
    return { todayPL: today, weekPL: week, monthPL: month, winRate: Math.round((wins / Math.max(1, wins + losses)) * 100), avgOdds: Math.round(avgOdds * 100) / 100, totalBets: total, wonBets: wins, lostBets: losses };
  }, [history]);

  return { activeBets, betHistory, quick };
}

export type UseNewMyBetsData = ReturnType<typeof useNewMyBetsData>;

