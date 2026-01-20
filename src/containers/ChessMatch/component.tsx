import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import './style.scss';
import ChessgroundWrapper from 'components/ChessgroundWrapper';
import { Config } from 'chessground/config';
import { Key } from 'chessground/types';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTrophy, faWrench } from '@fortawesome/free-solid-svg-icons';
import { useMode } from 'context/ModeContext';
import { tileMotionByVariant, presenceMode } from 'features/moveMenu/moveMenuTransitions';
import { RootState } from 'types/state';
import { Game, Move } from 'types/resources/game';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById, fetchGameStats } from 'store/actionCreators/gameActionCreators';
import { fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import { shortWagerReason } from 'utils/wagerErrorText';
import { getFeaturedMatch } from 'store/requests/matchesRequests';
import { Chess } from 'chess.js';
import { getTopMoves, type MoveAnalysis } from 'store/requests/analysisRequests';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { useHistory } from 'react-router-dom';
import { computeArcadeMoveOdds } from 'utils/pricing';
import { realWdlMultiplier } from 'utils/realOdds';
import { deriveMoveCandidates } from 'utils/moveCandidates';

const ChessMatch: React.FC = () => {
  type ClockState = 'idle' | 'ticking';
  type ActiveState = 'inactive' | 'active';
  type ConfirmState = 'idle' | 'loading' | 'confirmed' | 'rejected';

  type HeaderCombo = { clock: ClockState; active: ActiveState; confirm: ConfirmState };
  const combos: HeaderCombo[] = useMemo(() => ([
    { clock: 'idle',    active: 'inactive', confirm: 'idle'      },
    { clock: 'ticking', active: 'active',   confirm: 'loading'   },
    { clock: 'ticking', active: 'active',   confirm: 'confirmed' },
    { clock: 'ticking', active: 'active',   confirm: 'rejected'  },
    { clock: 'idle',    active: 'active',   confirm: 'idle'      },
  ]), []);

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const topState = combos[topIndex % combos.length];
  const bottomState = combos[bottomIndex % combos.length];
  const cycleTop = () => setTopIndex((i) => (i + 1) % combos.length);
  const cycleBottom = () => setBottomIndex((i) => (i + 1) % combos.length);

  // Move Panel Demo — simulate real candidate updates (analysis reorder, add/remove, score tweaks)
  type SimMove = { id: string; label: string; score: number };
  const CANDIDATE_POOL = useMemo(() => (
    ['e4','d4','c4','Nf3','Nc3','g3','b3','f4','Bb5','Bc4','O-O','O-O-O','a4','h3','h4','Qa4','Qf3']
  ), []);
  const [simMoves, setSimMoves] = useState<SimMove[]>(() => (
    ['e4','d4','Nf3','c4'].map((s, i) => ({ id: s, label: s, score: 100 - i * 8 }))
  ));
  const transitionVariant = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'none' as const;
      }
    } catch {}
    return 'morph' as const;
  }, []);
  const motionSpec = useMemo(() => tileMotionByVariant(transitionVariant), [transitionVariant]);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const [leftCols, setLeftCols] = useState(2);
  const [leftTile, setLeftTile] = useState(80);
  // Narrow layout detection for formatting
  const [isNarrow, setIsNarrow] = useState<boolean>(() => {
    try { return typeof window !== 'undefined' ? window.innerWidth < 900 : false; } catch { return false; }
  });
  useEffect(() => {
    const onResize = () => {
      try { setIsNarrow(typeof window !== 'undefined' && window.innerWidth < 900); } catch {}
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  type TileStatus = 'idle' | 'active' | 'disabled' | 'loading' | 'success';
  const [tileStates, setTileStates] = useState<TileStatus[]>(() => simMoves.map(() => 'idle'));
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [liveGameId, setLiveGameId] = useState<string>('');
  const [badgeMetaHTTP, setBadgeMetaHTTP] = useState<any | null>(null);
  const { mode, limits, risk } = useMode();
  const dispatch = useDispatch();
  const history = useHistory();
  const game: Game | undefined = useSelector((s: RootState) => (liveGameId ? s.game.games[liveGameId] : undefined));
  const allWagersMap = useSelector((s: RootState) => s.wager?.wagers ?? {});
  const fetchedHistory = useSelector((s: RootState) => s.wager?.wagerHistory ?? []);
  const isAuthenticated = useSelector((s: RootState) => s.auth?.isAuthenticated ?? false);
  const authUser = useSelector((s: RootState) => s.auth?.user || null);
  const demoSAN = useMemo(() => ['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7'], []);
  const sanList: string[] = useMemo(() => (
    (liveMode && game && Array.isArray(game.move_hist) && game?.move_hist?.length)
      ? (game.move_hist as Move[]).map((m) => String(m.san))
      : demoSAN
  ), [liveMode, game?.move_hist, demoSAN]);
  const [notationCursor, setNotationCursor] = useState<number>(0);
  const [pinnedLive, setPinnedLive] = useState<boolean>(true);
  const notationListRef = useRef<HTMLDivElement | null>(null);
  // Keep cursor pinned to latest when pinnedLive is true
  useEffect(() => {
    if (pinnedLive) setNotationCursor(Math.max(0, sanList.length - 1));
  }, [sanList.length, pinnedLive]);
  // Compute FEN for the current notation cursor snapshot (used for analysis/move candidates)
  const fenAtCursor = useMemo(() => {
    try {
      const c = new Chess();
      for (let i = 0; i <= notationCursor; i += 1) {
        const san = sanList[i];
        if (!san) break;
        try { c.move(san, { sloppy: true } as any); } catch { break; }
      }
      return c.fen();
    } catch { return game?.state || ''; }
  }, [notationCursor, sanList, game?.state]);

  // Hover arrow state for board overlay
  const [hoverArrow, setHoverArrow] = useState<[string, string] | null>(null);
  const normalizeMoveNotation = useCallback((move: string) => (
    String(move)
      .replace(/^[0-9]+\.{1,3}\s*/, '')
      .replace(/^\.{3}\s*/, '')
      .trim()
  ), []);
  const computeArrowForMove = useCallback((san: string): [string, string] | null => {
    try {
      const fen = (fenAtCursor || game?.state || undefined);
      const chess = new Chess(fen);
      const mv = chess.move(normalizeMoveNotation(san), { sloppy: true } as any);
      if (mv && mv.from && mv.to) return [String(mv.from), String(mv.to)];
    } catch {}
    return null;
  }, [fenAtCursor, game?.state, normalizeMoveNotation]);
  const handleMoveHoverStart = useCallback((san: string) => {
    const arrow = computeArrowForMove(san);
    setHoverArrow(arrow ? [arrow[0], arrow[1]] : null);
  }, [computeArrowForMove]);
  const handleMoveHoverEnd = useCallback(() => setHoverArrow(null), []);
  // Track analysis top moves for odds computation (Arcade)
  const [topMoves, setTopMoves] = useState<MoveAnalysis[]>([]);
  // Map of SAN -> emoji from latest HTTP analysis (fallback if websocket meta absent)
  const emojiByMove = useMemo(() => {
    const m = new Map<string, string>();
    try {
      for (const t of topMoves || []) {
        const k = String((t as any).move || '').replace(/[+#]$/g, '');
        const e = String((t as any).emoji || '');
        if (k && e) m.set(k, e);
      }
    } catch {}
    return m;
  }, [topMoves]);
  // Lift stake + presets to top-level so tile clicks can place wagers
  const [stake, setStake] = useState<number>(2);
  const presets = [1, 2, 3, 5];
  // Header CTA states (used for loading/confirmed/rejected styling)
  const [topHeaderStatus, setTopHeaderStatus] = useState<'idle'|'loading'|'confirmed'|'rejected'>('idle');
  const [bottomHeaderStatus, setBottomHeaderStatus] = useState<'idle'|'loading'|'confirmed'|'rejected'>('idle');
  // Optional brief reason strings for header rejections
  const [topHeaderReason, setTopHeaderReason] = useState<string>('');
  const [bottomHeaderReason, setBottomHeaderReason] = useState<string>('');
  const [pendingMove, setPendingMove] = useState<null | { san: string; index: number; startedAt: number }>(null);
  const [tileReasons, setTileReasons] = useState<Record<number, string>>({});
  // Track pending WDL submission to correlate with Redux changes
  const [pendingWdl, setPendingWdl] = useState<null | { outcome: 'white_win'|'black_win'|'draw'; origin: 'top'|'bottom'|'toolbar'; startedAt: number }>(null);
  // Bottom bar ephemeral status (e.g., move rejection reason)
  const [barMessage, setBarMessage] = useState<string>('');
  // Screen-reader friendly announcement region (no visible toast)
  const [liveAnnounce, setLiveAnnounce] = useState<string>('');

  // Clock display like ChessMatch
  const [displayWhiteSecs, setDisplayWhiteSecs] = useState<number>(0);
  const [displayBlackSecs, setDisplayBlackSecs] = useState<number>(0);
  const parseInitialSeconds = useCallback((tf?: string): number | null => {
    if (!tf) return null;
    const base = String(tf).split('+')[0]?.trim();
    const mins = Number.parseInt(base, 10);
    return Number.isFinite(mins) && mins >= 0 ? mins * 60 : null;
  }, []);
  // Initialize display clocks when values change
  useEffect(() => {
    const toSecs = (raw: number, tf?: string): number => {
      const initialSecs = parseInitialSeconds(tf);
      if (initialSecs != null) return raw > initialSecs * 10 ? Math.floor(raw / 1000) : Math.floor(raw);
      return raw > 10000 ? Math.floor(raw / 1000) : Math.floor(raw);
    };
    const w = Math.max(0, Number(game?.time_white ?? 0));
    const b = Math.max(0, Number(game?.time_black ?? 0));
    setDisplayWhiteSecs(toSecs(w, game?.time_format));
    setDisplayBlackSecs(toSecs(b, game?.time_format));
  }, [game?.time_white, game?.time_black, game?.time_format]);
  // Tick active side each second when live/latest and in progress
  const isGameInProgress = !!(game && !game.complete);
  const latestIndex = Math.max(0, sanList.length - 1);
  const isAtLatestSnapshot = notationCursor === latestIndex;
  const bettingEnabled = isGameInProgress && isAtLatestSnapshot;

  // Auto-stick notation to bottom (latest) while at live; do not force when user scrolled up
  useEffect(() => {
    if (!notationListRef.current) return;
    if (!isGameInProgress || !isAtLatestSnapshot) return;
    const el = notationListRef.current;
    try { el.scrollTop = el.scrollHeight; } catch {}
  }, [sanList.length, isAtLatestSnapshot, isGameInProgress]);

  useEffect(() => {
    if (!game || !isAtLatestSnapshot || !isGameInProgress) return undefined;
    let turn: 'w'|'b' = 'w';
    try { turn = new Chess(game.state).turn() as any; } catch {}
    const id = window.setInterval(() => {
      if (turn === 'w') setDisplayWhiteSecs((s) => Math.max(0, s - 1));
      else setDisplayBlackSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [game?._id, game?.state, isAtLatestSnapshot, isGameInProgress]);
  const displayReceipts = useMemo(() => {
    if (!liveMode || !liveGameId) return [] as any[];
    const local = Object.values(allWagersMap) as any[];
    const merged = [...local, ...fetchedHistory];
    const seen: Record<string, boolean> = {};
    const filtered = merged.filter((w) => {
      if (!w || seen[w._id]) return false;
      seen[w._id] = true;
      return String(w.game_id) === String(liveGameId);
    });
    filtered.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return filtered.slice(0, 10);
  }, [allWagersMap, fetchedHistory, liveMode, liveGameId]);

  // Subtle entrance/highlight for new or updated receipts
  const knownReceiptIdsRef = useRef<Set<string>>(new Set());
  const lastStatusRef = useRef<Record<string, string>>({});
  const [enteringIds, setEnteringIds] = useState<Record<string, boolean>>({});
  const [updatedIds, setUpdatedIds] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const timeouts: number[] = [];
    const known = knownReceiptIdsRef.current;
    const last = lastStatusRef.current;
    for (const w of displayReceipts) {
      const id = String(w._id);
      const prevKnown = known.has(id);
      const prevStatus = last[id];
      const curStatus = String(w.status || '');
      // New receipt entrance
      if (!prevKnown) {
        known.add(id);
        setEnteringIds((m) => ({ ...m, [id]: true }));
        const t = window.setTimeout(() => setEnteringIds((m) => { const n = { ...m }; delete n[id]; return n; }), 220);
        timeouts.push(t);
      }
      // Status changed pulse
      if (prevStatus && prevStatus !== curStatus) {
        setUpdatedIds((m) => ({ ...m, [id]: true }));
        const t2 = window.setTimeout(() => setUpdatedIds((m) => { const n = { ...m }; delete n[id]; return n; }), 480);
        timeouts.push(t2);
      }
      // Track latest status
      last[id] = curStatus;
    }
    return () => { timeouts.forEach((t) => window.clearTimeout(t)); };
  }, [displayReceipts]);

  const nextPosition = useCallback(() => {
    setSimMoves(() => {
      // Pick 4 unique candidates and assign descending scores to simulate a new analysis frame
      const pool = CANDIDATE_POOL.slice();
      const picks: string[] = [];
      while (picks.length < 4 && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(idx, 1)[0]);
      }
      const base = Math.round(70 + Math.random() * 30);
      return picks.map((s, i) => ({
        id: `${s}-${Date.now()}`,
        label: s,
        score: Math.max(10, base - i * (5 + Math.round(Math.random() * 5))),
      }));
    });
  }, [CANDIDATE_POOL]);

  useEffect(() => {
    if (!autoAdvance) return;
    const t = window.setInterval(() => { nextPosition(); }, 6000);
    return () => window.clearInterval(t);
  }, [autoAdvance, nextPosition]);

  // Poll featured match ID and follow it
  useEffect(() => {
    let mounted = true;
    const fetchFeatured = async () => {
      try {
        const resp = await getFeaturedMatch();
        const id = String(resp?.data?.match_id || '');
        if (mounted && id && id !== liveGameId) {
          // Switch to new featured game
          try { if (liveGameId) dispatch(leaveGame(liveGameId)); } catch {}
          setLiveGameId(id);
          // When switching to a new live game, pin to latest
          setPinnedLive(true);
        }
      } catch {}
    };
    fetchFeatured();
    const t = window.setInterval(fetchFeatured, 10000);
    return () => { mounted = false; window.clearInterval(t); };
  }, [dispatch, liveGameId]);

  // Live mode lifecycle: join/leave current featured game, fetch data
  useEffect(() => {
    if (!liveMode || !liveGameId) return;
    try {
      dispatch(fetchGameById(liveGameId));
      dispatch(fetchGameStats(liveGameId));
    } catch {}
    try { dispatch(joinGame(liveGameId)); } catch {}
    const h = window.setInterval(() => { try { dispatch(fetchWagerHistory(undefined, 10, 0)); } catch {} }, 5000);
    return () => {
      try { dispatch(leaveGame(liveGameId)); } catch {}
      window.clearInterval(h);
    };
  }, [dispatch, liveMode, liveGameId]);
  const cycleTileState = (index: number) => {
    setTileStates((prev) => {
      const next = [...prev];
      const order: TileStatus[] = ['idle', 'active', 'loading', 'success', 'disabled'];
      const cur = prev[index] || 'idle';
      const idx = order.indexOf(cur);
      next[index] = order[(idx + 1) % order.length];
      return next;
    });
  };
  // Simulate stream-like updates (disabled when live is on)
  useEffect(() => {
    if (liveMode) return;
    const t = window.setInterval(() => {
      setSimMoves((prev) => {
        if (!prev.length) return prev;
        const roll = Math.random();
        const next = [...prev];
        if (roll < 0.34) {
          // Reorder subtly via score jitter (like analysis updates)
          const jitter = next.map(m => ({ ...m, score: Math.max(10, Math.round(m.score + (Math.random()*10 - 5))) }));
          jitter.sort((a, b) => b.score - a.score);
          return jitter;
        } else if (roll < 0.67) {
          // Replace a candidate (enter/exit)
          const pool = CANDIDATE_POOL.filter(s => !next.some(n => n.id === s));
          if (pool.length) {
            const idx = Math.floor(Math.random() * next.length);
            const add = pool[Math.floor(Math.random()*pool.length)];
            next.splice(idx, 1, { id: add, label: add, score: Math.round(70 + Math.random()*30) });
            return next;
          }
          return next;
        }
        // Text-only score update
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = { ...next[idx], score: Math.max(10, Math.round(next[idx].score + (Math.random()*12 - 6))) };
        return next;
      });
      // align tile state length
      setTileStates((prev) => Array.from({ length: simMoves.length }, (_, i) => prev[i] || 'idle'));
    }, 1400);
    return () => window.clearInterval(t);
  }, [CANDIDATE_POOL, simMoves.length, liveMode]);

  // Live move tiles: fetch top moves for current FEN
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const fen = fenAtCursor || '';
      if (!fen) return;
      try {
        const resp: any = await getTopMoves(fen, 12, { gameId: liveGameId, atMove: notationCursor + 1 });
        const arr: MoveAnalysis[] = Array.isArray(resp?.data) ? (resp.data as any) : [];
        setBadgeMetaHTTP(resp?.meta || null);
        if (!cancelled) setTopMoves(arr);
        const offered = (game?.pool_wagers?.move?.options as string[] | undefined) || undefined;
        const candidates = deriveMoveCandidates(fen, arr, offered, 8).slice(0, 4);
        const top = candidates.map((mv, i) => ({ id: `${String(mv)}-${sanList.length}`, label: String(mv), score: Math.max(10, Math.round(100 - i * 8)) }));
        if (!cancelled && top.length) {
          setSimMoves(top);
          setTileStates((prev) => Array.from({ length: top.length }, (_, i) => prev[i] || 'idle'));
        }
      } catch {}
    };
    run();
    const t = window.setTimeout(run, 350);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [fenAtCursor, game?.pool_wagers?.move?.options, sanList.length]);

  useEffect(() => {
    if (!leftPanelRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      const W = Math.floor(cr.width);
      const H = Math.floor(cr.height);
      if (W <= 0 || H <= 0) return;

      // Use the actual grid gap from CSS to keep math in sync with styles
      const el = leftPanelRef.current as HTMLElement;
      const cs = window.getComputedStyle(el);
      const parsePx = (v: string | null | undefined) => {
        if (!v) return 0;
        const n = parseFloat(String(v).trim());
        return Number.isFinite(n) ? n : 0;
      };
      const gapVar = cs.getPropertyValue('--lp-gap');
      const colGap = cs.getPropertyValue('column-gap');
      const gap = parsePx(gapVar) || parsePx(colGap) || 14;

      const viewportW = typeof window !== 'undefined' ? window.innerWidth : W;
      // Mobile: force a single row (N columns), compute tile from width only
      if (viewportW < 768) {
        const n = Math.max(1, simMoves.length);
        const tileW = Math.floor((W - gap * (n - 1)) / n);
        const bestTile = Math.max(0, tileW);
        const breathing = Math.floor(bestTile * 0.88);
        setLeftCols(n);
        setLeftTile(Math.max(44, breathing));
        return;
      }

      // Tablet/Desktop: search best fit (columns x rows) within container
      let bestTile = 0;
      let bestCols = 1;
      for (let c = 1; c <= simMoves.length; c += 1) {
        const rows = Math.ceil(simMoves.length / c);
        const tileW = Math.floor((W - gap * (c - 1)) / c);
        const tileH = Math.floor((H - gap * (rows - 1)) / rows);
        const size = Math.max(0, Math.min(tileW, tileH));
        if (size > bestTile) { bestTile = size; bestCols = c; }
      }
      const breathing = Math.floor(bestTile * 0.92);
      setLeftCols(bestCols);
      setLeftTile(Math.max(56, breathing));
    });
    ro.observe(leftPanelRef.current);
    return () => ro.disconnect();
  }, [simMoves.length]);

  // Build board config with hover arrow overlay
  const boardConfig: Config = useMemo(() => {
    const cfg = buildBoardConfig(game);
    // Compute snapshot FEN and last move from notation cursor
    try {
      if (game && Array.isArray(game.move_hist)) {
        const c = new Chess();
        for (let i = 0; i <= notationCursor; i += 1) {
          const san = sanList[i];
          if (!san) break;
          try { c.move(san, { sloppy: true } as any); } catch { break; }
        }
        (cfg as any).fen = c.fen();
        const mv = game.move_hist[notationCursor];
        if (mv && mv.from && mv.to) {
          (cfg as any).lastMove = [mv.from as any, mv.to as any];
        }
      }
    } catch {}
    const shapes = hoverArrow ? [{ orig: hoverArrow[0] as Key, dest: hoverArrow[1] as Key, brush: 'green' as any }] : [];
    return {
      ...cfg,
      drawable: {
        enabled: true,
        visible: true,
        defaultSnapToValidMove: true,
        eraseOnClick: false,
        autoShapes: shapes as any,
      } as any,
    } as Config;
  }, [game, hoverArrow, notationCursor, sanList]);

  const sideToMove = useMemo(() => {
    try { return new Chess(game?.state || '').turn() as 'w'|'b'; } catch { return 'w'; }
  }, [game?.state]);

  // Compute per-move odds/multipliers to display on tiles
  const arcadeOddsMap: Record<string, number> = useMemo(() => {
    try {
      const offered = simMoves.map(m => m.label).filter(Boolean);
      if (!offered.length) return {};
      if (mode !== 'arcade') return {};
      const topLite = (topMoves || []).map(t => ({ move: String(t.move), score: Number(t.score || 0) }));
      const margin = limits?.arcadeMoveMargin ?? 0.08;
      return computeArcadeMoveOdds(offered, topLite, margin);
    } catch { return {}; }
  }, [simMoves, topMoves, mode, limits]);

  const poolTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const wagers = game?.pool_wagers?.move?.wagers ?? [];
    (wagers as any[]).forEach((w) => {
      if (!w?.data) return;
      const key = String(w.data).replace(/[+#]$/g, '');
      totals[key] = (totals[key] ?? 0) + (Number(w.amount) || 0);
    });
    return totals;
  }, [game?.pool_wagers?.move?.wagers]);

  const poolTotalSum = useMemo(() => Object.values(poolTotals).reduce((s, v) => s + v, 0), [poolTotals]);

  const estimateRealMoveMultiplier = useCallback((san: string): number | null => {
    if (mode !== 'real') return null;
    const key = String(san).replace(/[+#]$/g, '');
    const win = poolTotals[key] ?? 0;
    const rake = typeof limits?.poolRake === 'number' ? Math.max(0, Math.min(0.25, limits!.poolRake)) : 0.05;
    const s = Math.max(1, Number(stake) || 1);
    const payoutPerStake = ((poolTotalSum + s) * (1 - rake)) / Math.max(1e-6, (win + s));
    return Math.max(1, Math.round(payoutPerStake * 100) / 100);
  }, [mode, poolTotals, poolTotalSum, limits, stake]);

  // Compute WDL multipliers for headers and Draw button
  const moveNumForWdl = useMemo(() => {
    const len = Array.isArray(game?.move_hist) ? (game!.move_hist.length || 0) : 0;
    return len + 1;
  }, [game?.move_hist]);
  const pWhite = Number((game as any)?.odds?.white_win || 0);
  const pDraw = Number((game as any)?.odds?.draw || 0);
  const pBlack = Number((game as any)?.odds?.black_win || 0);
  const headerWhiteX = useMemo(() => {
    if (!(pWhite > 0)) return null;
    return mode === 'arcade' ? Math.max(1, Math.round((1 / pWhite) * 100) / 100)
      : realWdlMultiplier('white_win', pWhite, moveNumForWdl, risk as any);
  }, [mode, pWhite, moveNumForWdl, risk]);
  const headerBlackX = useMemo(() => {
    if (!(pBlack > 0)) return null;
    return mode === 'arcade' ? Math.max(1, Math.round((1 / pBlack) * 100) / 100)
      : realWdlMultiplier('black_win', pBlack, moveNumForWdl, risk as any);
  }, [mode, pBlack, moveNumForWdl, risk]);
  const drawX = useMemo(() => {
    if (!(pDraw > 0)) return null;
    return mode === 'arcade' ? Math.max(1, Math.round((1 / pDraw) * 100) / 100)
      : realWdlMultiplier('draw', pDraw, moveNumForWdl, risk as any);
  }, [mode, pDraw, moveNumForWdl, risk]);

  // Place a real move wager when clicking a tile in live mode
  const handlePlaceMoveBet = useCallback((san: string) => {
    if (!liveMode) return; // Only place bets in live mode
    if (!isAtLatestSnapshot) return; // Disable when viewing historical snapshot
    if (!game?._id) return;
    if (!isAuthenticated) { setBarMessage('Sign in to bet'); setTimeout(() => setBarMessage(''), 1400); history.push('/signin'); return; }
    const amount = Math.max(1, Number(stake) || 1);
    const wdl = false;
    const moveNumber = (Array.isArray(game?.move_hist) ? game!.move_hist.length : 0) + 1;
    const currency: 'BET' | 'USDT' = mode === 'real' ? 'USDT' : 'BET';

    let odds = 1;
    if (mode === 'arcade') {
      const mv = String(san);
      odds = arcadeOddsMap[mv] ?? 1;
    }

    const idx = simMoves.findIndex(m => String(m.label) === String(san));
    if (idx >= 0) {
      // Debounce repeated clicks while loading
      if ((tileStates[idx] || 'idle') === 'loading') return;
    }

    // Client-side pre-checks: balance and Arcade cap
    try {
      const arcadeBal = Math.max(0, Number((authUser as any)?.token_balance ?? (authUser as any)?.account ?? 0));
      const cashBal = Math.max(0, Number((authUser as any)?.cash_balance ?? 0));
      const effectiveBal = mode === 'real' ? cashBal : arcadeBal;
      if (amount > effectiveBal) {
        const reason = shortWagerReason('INSUFFICIENT', 'Insufficient funds');
        if (idx >= 0) {
          setTileStates((prev) => prev.map((st, i) => (i === idx ? 'disabled' : st)));
          setTileReasons((m) => ({ ...m, [idx]: reason }));
          setTimeout(() => setTileReasons((m) => { const n = { ...m }; delete n[idx]; return n; }), 1600);
        }
        setBarMessage(`Move bet rejected — ${reason}`);
        setTimeout(() => setBarMessage(''), 1600);
        setLiveAnnounce(`Move bet rejected — ${reason}`);
        return;
      }
      if (mode !== 'real' && limits) {
        const maxMove = Number(limits.arcadeMaxStakeMove || Infinity);
        if (amount > maxMove) {
          const reason = shortWagerReason('CAP_PER_BET', 'Stake exceeds maximum for this bet');
          if (idx >= 0) {
            setTileStates((prev) => prev.map((st, i) => (i === idx ? 'disabled' : st)));
            setTileReasons((m) => ({ ...m, [idx]: reason }));
            setTimeout(() => setTileReasons((m) => { const n = { ...m }; delete n[idx]; return n; }), 1600);
          }
          setBarMessage(`Move bet rejected — ${reason}`);
          setTimeout(() => setBarMessage(''), 1600);
          setLiveAnnounce(`Move bet rejected — ${reason}`);
          return;
        }
      }
    } catch {}

    if (idx >= 0) {
      setTileStates((prev) => prev.map((st, i) => (i === idx ? 'loading' : st)));
      setPendingMove({ san: String(san), index: idx, startedAt: Date.now() });
    }

    try {
      dispatch(createWager(String(game!._id), String(san), amount, wdl, odds, moveNumber, mode, currency));
    } catch {}
  }, [dispatch, game?._id, game?.move_hist, isAuthenticated, history, stake, mode, arcadeOddsMap, liveMode, simMoves, tileStates, limits, authUser]);

  // Place WDL wager (used by Player Headers and Draw button)
  const handlePlaceWdlBet = useCallback((outcome: 'white_win'|'draw'|'black_win', origin?: 'top'|'bottom'|'toolbar') => {
    if (!isAtLatestSnapshot || !isGameInProgress) return;
    if (!game?._id) return;
    if (!isAuthenticated) {
      const msg = 'Sign in to bet';
      if (origin === 'top') { setTopHeaderReason(msg); setTopHeaderStatus('rejected'); setTimeout(() => { setTopHeaderStatus('idle'); setTopHeaderReason(''); }, 1600); }
      if (origin === 'bottom') { setBottomHeaderReason(msg); setBottomHeaderStatus('rejected'); setTimeout(() => { setBottomHeaderStatus('idle'); setBottomHeaderReason(''); }, 1600); }
      if (origin === 'toolbar') { setBarMessage(msg); setTimeout(() => setBarMessage(''), 1600); }
      history.push('/signin');
      return;
    }
    // Debounce multiple clicks while loading
    if (origin === 'top' && topHeaderStatus === 'loading') return;
    if (origin === 'bottom' && bottomHeaderStatus === 'loading') return;
    const amount = Math.max(1, Number(stake) || 1);
    const moveNum = (Array.isArray(game?.move_hist) ? game!.move_hist.length : 0) + 1;
    const currency: 'BET' | 'USDT' = mode === 'real' ? 'USDT' : 'BET';

    // Compute UI odds est; server will recompute for Real
    const pMap = (game as any)?.odds || {};
    const p = outcome === 'white_win' ? Number(pMap.white_win || 0)
              : outcome === 'black_win' ? Number(pMap.black_win || 0)
              : Number(pMap.draw || 0);
    let odds = 1;
    if (mode === 'arcade') odds = p > 0 ? Math.round((1 / p) * 100) / 100 : 1;
    else odds = p > 0 ? realWdlMultiplier(outcome, p, moveNum, risk as any) : 1;

    // Client-side pre-checks: balance and Arcade WDL cap
    try {
      const arcadeBal = Math.max(0, Number((authUser as any)?.token_balance ?? (authUser as any)?.account ?? 0));
      const cashBal = Math.max(0, Number((authUser as any)?.cash_balance ?? 0));
      const effectiveBal = mode === 'real' ? cashBal : arcadeBal;
      if (amount > effectiveBal) {
        const reason = shortWagerReason('INSUFFICIENT', 'Insufficient funds');
        if (origin === 'top') { setTopHeaderReason(reason); setTopHeaderStatus('rejected'); setTimeout(() => { setTopHeaderStatus('idle'); setTopHeaderReason(''); }, 1600); }
        if (origin === 'bottom') { setBottomHeaderReason(reason); setBottomHeaderStatus('rejected'); setTimeout(() => { setBottomHeaderStatus('idle'); setBottomHeaderReason(''); }, 1600); }
        if (origin === 'toolbar') { setBarMessage(`Wager rejected — ${reason}`); setTimeout(() => setBarMessage(''), 1600); }
        setLiveAnnounce(`Wager rejected — ${reason}`);
        return;
      }
      if (mode !== 'real' && limits) {
        const maxWdl = Number(limits.arcadeMaxStakeWdl || Infinity);
        if (amount > maxWdl) {
          const reason = shortWagerReason('CAP_PER_BET', 'Stake exceeds maximum for this bet');
          if (origin === 'top') { setTopHeaderReason(reason); setTopHeaderStatus('rejected'); setTimeout(() => { setTopHeaderStatus('idle'); setTopHeaderReason(''); }, 1600); }
          if (origin === 'bottom') { setBottomHeaderReason(reason); setBottomHeaderStatus('rejected'); setTimeout(() => { setBottomHeaderStatus('idle'); setBottomHeaderReason(''); }, 1600); }
          if (origin === 'toolbar') { setBarMessage(`Wager rejected — ${reason}`); setTimeout(() => setBarMessage(''), 1600); }
          setLiveAnnounce(`Wager rejected — ${reason}`);
          return;
        }
      }
    } catch {}

    // Indicate loading state on the header that initiated the action
    if (origin === 'top') setTopHeaderStatus('loading');
    if (origin === 'bottom') setBottomHeaderStatus('loading');
    setPendingWdl({ outcome, origin: (origin || 'toolbar'), startedAt: Date.now() });
    try {
      dispatch(createWager(String(game!._id), outcome, amount, true, odds, moveNum, mode, currency));
    } catch {
      if (origin === 'top') { setTopHeaderStatus('rejected'); setTimeout(() => setTopHeaderStatus('idle'), 1400); }
      if (origin === 'bottom') { setBottomHeaderStatus('rejected'); setTimeout(() => setBottomHeaderStatus('idle'), 1400); }
    }
  }, [dispatch, game?._id, game?.move_hist, isAuthenticated, history, stake, mode, risk, limits, topHeaderStatus, bottomHeaderStatus, authUser]);

  // React to wager create success/failure from Redux
  const wagersMap = useSelector((s: RootState) => s.wager.wagers);
  const wagerError = useSelector((s: RootState) => s.wager.error);
  const wagerErrorCode = useSelector((s: RootState) => s.wager.errorCode);
  const wagersCount = Object.keys(wagersMap || {}).length;
  const lastWagersRef = useRef<number>(wagersCount);
  useEffect(() => {
    if (!pendingWdl) return;
    // Failure path: if reducer error is set soon after request
    if (wagerError) {
      const short = shortWagerReason(wagerErrorCode as any, String(wagerError));
      // Show inline rejected state on the header that initiated the bet
      if (pendingWdl.origin === 'top') {
        setTopHeaderReason(short);
        setTopHeaderStatus('rejected');
        setTimeout(() => { setTopHeaderStatus('idle'); setTopHeaderReason(''); }, 1600);
      }
      if (pendingWdl.origin === 'bottom') {
        setBottomHeaderReason(short);
        setBottomHeaderStatus('rejected');
        setTimeout(() => { setBottomHeaderStatus('idle'); setBottomHeaderReason(''); }, 1600);
      }
      // If rejection was from toolbar (center Draw), surface in bottom bar
      if (pendingWdl.origin === 'toolbar') {
        setBarMessage(`Wager rejected — ${short}`);
        setTimeout(() => setBarMessage(''), 1600);
      }
      // Announce for assistive tech
      try { setLiveAnnounce(`Wager rejected — ${short}`); } catch {}
      setPendingWdl(null);
      return;
    }
    // Success path: detect new wager matching outcome
    const prev = lastWagersRef.current;
    if (wagersCount > prev) {
      const list = Object.values(wagersMap || {});
      const recent = list.filter(w => String(w.game_id) === String(game?._id) && w.wdl === true && String(w.data) === pendingWdl.outcome);
      if (recent.length) {
        if (pendingWdl.origin === 'top') { setTopHeaderStatus('confirmed'); setTimeout(() => setTopHeaderStatus('idle'), 1200); }
        if (pendingWdl.origin === 'bottom') { setBottomHeaderStatus('confirmed'); setTimeout(() => setBottomHeaderStatus('idle'), 1200); }
        try { setLiveAnnounce('Wager accepted'); } catch {}
        setPendingWdl(null);
      }
    }
    lastWagersRef.current = wagersCount;
  }, [wagersCount, wagersMap, wagerError, pendingWdl, game?._id]);

  // React to move wager creation for tile states
  useEffect(() => {
    if (!pendingMove) return;
    if (wagerError) {
      const short = shortWagerReason(wagerErrorCode as any, String(wagerError));
      const i = pendingMove.index;
      setTileStates((prev) => prev.map((st, idx) => (idx === i ? 'disabled' : st)));
      // Surface brief reason in bottom bar and tile tooltip
      setBarMessage(`Move bet rejected — ${short}`);
      setTileReasons((m) => ({ ...m, [i]: short }));
      setTimeout(() => {
        setTileStates((prev) => prev.map((st, idx) => (idx === i ? 'idle' : st)));
        setBarMessage('');
        setTileReasons((m) => { const n = { ...m }; delete n[i]; return n; });
      }, 1600);
      try { setLiveAnnounce(`Move bet rejected — ${short}`); } catch {}
      setPendingMove(null);
      return;
    }
    const prev = lastWagersRef.current;
    if (wagersCount > prev) {
      const list = Object.values(wagersMap || {});
      const recent = list.filter(w => String(w.game_id) === String(game?._id) && w.wdl === false && String(w.data) === pendingMove.san);
      if (recent.length) {
        const i = pendingMove.index;
        setTileStates((prev) => prev.map((st, idx) => (idx === i ? 'success' : st)));
        setTimeout(() => setTileStates((prev) => prev.map((st, idx) => (idx === i ? 'idle' : st))), 1200);
        try { setLiveAnnounce('Wager accepted'); } catch {}
        setPendingMove(null);
      }
    }
    lastWagersRef.current = wagersCount;
  }, [wagersCount, wagersMap, wagerError, pendingMove, game?._id]);

  return (
    <div className="match-page">
      <NavBar compact={true} />
      <main className="match-page__content">
        {/* Visually hidden aria-live region for accept/reject announcements */}
        <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>{liveAnnounce}</div>
        <div className="match-layout-grid">
          <div className="frame frame--left" aria-label="left-panel">
            {(() => {
              const styleVars = { ['--cols' as any]: leftCols, ['--tile' as any]: `${leftTile}px` };
              const list = (
                <AnimatePresence initial={false} mode={presenceMode}>
                  {simMoves.map((m, i) => {
                    const st = tileStates[i] || 'idle';
                    const locked = !bettingEnabled || !liveMode;
                    const classes = ['lp-tile', locked ? 'is-disabled' : '', `is-${st}`].filter(Boolean).join(' ');
                    // Compute display multiplier per tile
                    const label = m.label;
                    const arcadeX = arcadeOddsMap[label];
                    const realX = estimateRealMoveMultiplier(label);
                    const showX = mode === 'arcade' ? arcadeX : realX;
                    // Confidence (0..1) based on relative score across tiles
                    const scores = simMoves.map(mm => mm.score);
                    const minS = Math.min(...scores);
                    const maxS = Math.max(...scores);
                    const span = Math.max(1, maxS - minS);
                    const conf = Math.max(0, Math.min(1, (m.score - minS) / span));
                    const confOpacity = 0.25 + conf * 0.65; // 0.25..0.9
                    // Prefer server-provided badge (emoji/opening) from websocket badge_meta
                    const rawBadges = (game as any)?.badge_meta?.badges || {};
                    const rawBadgesHttp = (badgeMetaHTTP && (badgeMetaHTTP as any).badges) ? (badgeMetaHTTP as any).badges : {};
                    const canonical = (s: string) => String(s || '').replace(/[+#]$/g, '');
                    const bExact = rawBadges[label];
                    const bCanon = rawBadges[canonical(label)];
                    const httpExact = rawBadgesHttp[label];
                    const httpCanon = rawBadgesHttp[canonical(label)];
                    const serverBadge = (bExact || bCanon) || (httpExact || httpCanon);
                    const isOpening = serverBadge && serverBadge.badge_type === 'opening';
                    const openingName = isOpening ? String(serverBadge.badge_text || '') : '';
                    const openingSub = isOpening ? String(serverBadge.badge_subtext || '') : '';
                    const emojiGlyph = (serverBadge && serverBadge.badge_type === 'emoji')
                      ? String(serverBadge.badge_text || '')
                      : (emojiByMove.get(canonical(label)) || '');
                    // Header: keep move text clear; drop tag when opening
                    const tinyGlyph = isOpening ? '' : (emojiGlyph || tinyCategoryGlyph(m.label));
                    // Icon zone: center opening name; else emoji or fallback glyph
                    const bigGlyph = isOpening ? openingName : (emojiGlyph || largeIconGlyph(m.label, sideToMove));
                    const reason = tileReasons[i];
                    return (
                      <motion.div
                        layout
                        key={m.id}
                        initial={motionSpec.initial as any}
                        animate={motionSpec.animate as any}
                        exit={motionSpec.exit as any}
                        transition={motionSpec.transition}
                        className={classes}
                        title={locked
                          ? `${m.label} · Go Live to place bets`
                          : (reason ? `${m.label} · Rejected — ${reason}` : `${m.label}${typeof showX === 'number' ? ` · x${showX}` : ''}`)}
                        onClick={() => (liveMode && bettingEnabled ? handlePlaceMoveBet(m.label) : undefined)}
                        onMouseEnter={() => handleMoveHoverStart(m.label)}
                        onMouseLeave={handleMoveHoverEnd}
                        onFocus={() => handleMoveHoverStart(m.label)}
                        onBlur={handleMoveHoverEnd}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && liveMode && bettingEnabled) handlePlaceMoveBet(m.label); }}
                        aria-disabled={locked || st === 'disabled'}
                        aria-busy={st === 'loading'}
                        aria-pressed={st === 'active'}
                      >
                        <span className="lp-conf" style={{ opacity: confOpacity }} aria-hidden />
                        <div className="lp-tile__chip" aria-hidden />
                        <div className="lp-tile__spinner" aria-hidden />
                        <div className="lp-tile__check" aria-hidden>✓</div>
                        <div className="lp-card" aria-label={`Move ${m.label}`}>
                          <div className="lp-header">
                            <span className="lp-h-glyph" aria-hidden>{tinyGlyph}</span>
                            <span className="lp-h-move">{m.label}</span>
                          </div>
                          <div className="lp-iconzone">
                            {isOpening ? (
                              <div className="lp-iz-glyph lp-iz-opening" aria-hidden>
                                <div className="op-main">{openingName}</div>
                                {openingSub ? <div className="op-sub">{openingSub}</div> : null}
                              </div>
                            ) : (
                              <span className="lp-iz-glyph" aria-hidden>{bigGlyph}</span>
                            )}
                          </div>
                          <div className="lp-footer">
                            <span className="lp-f-score" aria-label="Score">{m.score}</span>
                            {typeof showX === 'number' && (
                              <span className="lp-f-odds" aria-label="Estimated multiplier">x{(isNarrow ? showX.toFixed(1) : showX.toFixed(2))}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              );
              return (
                <div className="left-panel" ref={leftPanelRef} style={styleVars} data-tour-id="move-tiles">
                  {list}
                </div>
              );
            })()}
          </div>
          <div className="frame frame--board" aria-label="board" data-tour-id="board">
            <div className="board-inner">
              <div
                data-tour-id="player-header"
                className={[
                  'board-header',
                  'board-header--top',
                  'outcome-action',
                  (liveMode && game && (() => { try { const c = new Chess(game.state); return c.turn() === 'b'; } catch { return false; } })()) ? 'is-active' : 'is-inactive',
                  (isAtLatestSnapshot && isGameInProgress && (() => { try { return new Chess(game.state).turn() === 'b'; } catch { return false; } })()) ? 'is-ticking' : '',
                  topHeaderStatus === 'loading' ? 'is-loading' : '',
                  topHeaderStatus === 'confirmed' ? 'is-confirmed' : '',
                  topHeaderStatus === 'rejected' ? 'is-rejected' : '',
                  bettingEnabled ? '' : 'is-disabled',
                ].filter(Boolean).join(' ')}
                onClick={() => { if (bettingEnabled) handlePlaceWdlBet('black_win', 'top'); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && bettingEnabled) handlePlaceWdlBet('black_win', 'top'); }}
                aria-label="Bet on Black"
                aria-disabled={!bettingEnabled}
                aria-busy={topHeaderStatus === 'loading'}
                title={bettingEnabled
                  ? (topHeaderStatus === 'rejected' && topHeaderReason ? `Rejected — ${topHeaderReason}` : undefined)
                  : 'Go Live to place bets'}
              >
                <div className="ph-left">
                  <div className="ph-name">{liveMode ? (game?.player_black?.name || 'Black') : 'Player 1'}</div>
                  <div className="ph-rating">{liveMode ? (game?.player_black?.elo || '') : '2420'}</div>
                </div>
                <div className="ph-right">
                  <div className="ph-clock">
                    <span>{liveMode ? formatClockSafe(displayBlackSecs, game?.time_format) : '05:00'}</span>
                    <span className="tick-dot" aria-hidden />
                  </div>
                  {typeof headerBlackX === 'number' && (
                    <div className="ph-odds" title={`Black x${headerBlackX.toFixed(2)}`}>x{headerBlackX.toFixed(2)}</div>
                  )}
                  <div className="ph-state-chip" aria-hidden />
                  {topHeaderStatus === 'rejected' && topHeaderReason && (
                    <div className="ph-reason" style={{ marginLeft: 8, fontSize: 12, opacity: 0.9 }}>Rejected — {topHeaderReason}</div>
                  )}
                </div>
              </div>
              <div className="board-center">
                <div className="board-square">
                  <div className="chessboard-wrapper brown" style={{ width: '100%', height: '100%' }}>
                    <ChessgroundWrapper config={boardConfig} />
                  </div>
                </div>
                {(() => {
                  // Compute evaluation percentages (fallback to even thirds)
                  const wProb = Number((game as any)?.odds?.white_win ?? 0.33);
                  const dProb = Number((game as any)?.odds?.draw ?? 0.34);
                  const bProb = Number((game as any)?.odds?.black_win ?? 0.33);
                  const toPct = (p: number) => Math.max(0, Math.min(100, Math.round(p * 100)));
                  const whitePct = toPct(wProb);
                  const drawPct = toPct(dProb);
                  // Ensure total = 100 by assigning remainder to black
                  const blackPct = Math.max(0, Math.min(100, 100 - whitePct - drawPct));
                  return (
                    <div className="eval-bar" role="meter" aria-label="Evaluation bar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={whitePct}>
                      <div className="eval-bar__seg eval-bar__seg--black" style={{ height: `${blackPct}%` }}>
                        <span className="eval-bar__pct">{blackPct}%</span>
                      </div>
                      <div className="eval-bar__seg eval-bar__seg--draw" style={{ height: `${drawPct}%` }}>
                        <span className="eval-bar__pct">{drawPct}%</span>
                      </div>
                      <div className="eval-bar__seg eval-bar__seg--white" style={{ height: `${whitePct}%` }}>
                        <span className="eval-bar__pct eval-bar__pct--dark">{whitePct}%</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div
                className={[
                  'board-header',
                  'board-header--bottom',
                  'outcome-action',
                  (liveMode && game && (() => { try { const c = new Chess(game.state); return c.turn() === 'w'; } catch { return false; } })()) ? 'is-active' : 'is-inactive',
                  (isAtLatestSnapshot && isGameInProgress && (() => { try { return new Chess(game.state).turn() === 'w'; } catch { return false; } })()) ? 'is-ticking' : '',
                  bottomHeaderStatus === 'loading' ? 'is-loading' : '',
                  bottomHeaderStatus === 'confirmed' ? 'is-confirmed' : '',
                  bottomHeaderStatus === 'rejected' ? 'is-rejected' : '',
                  bettingEnabled ? '' : 'is-disabled',
                ].filter(Boolean).join(' ')}
                onClick={() => { if (bettingEnabled) handlePlaceWdlBet('white_win', 'bottom'); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && bettingEnabled) handlePlaceWdlBet('white_win', 'bottom'); }}
                aria-label="Bet on White"
                aria-disabled={!bettingEnabled}
                aria-busy={bottomHeaderStatus === 'loading'}
                title={bettingEnabled
                  ? (bottomHeaderStatus === 'rejected' && bottomHeaderReason ? `Rejected — ${bottomHeaderReason}` : undefined)
                  : 'Go Live to place bets'}
              >
                <div className="ph-left">
                  <div className="ph-name">{liveMode ? (game?.player_white?.name || 'White') : 'Player 2'}</div>
                  <div className="ph-rating">{liveMode ? (game?.player_white?.elo || '') : '2510'}</div>
                </div>
                <div className="ph-right">
                  <div className="ph-clock">
                    <span>{liveMode ? formatClockSafe(displayWhiteSecs, game?.time_format) : '04:32'}</span>
                    <span className="tick-dot" aria-hidden />
                  </div>
                  {typeof headerWhiteX === 'number' && (
                    <div className="ph-odds" title={`White x${headerWhiteX.toFixed(2)}`}>x{headerWhiteX.toFixed(2)}</div>
                  )}
                  <div className="ph-state-chip" aria-hidden />
                  {bottomHeaderStatus === 'rejected' && bottomHeaderReason && (
                    <div className="ph-reason" style={{ marginLeft: 8, fontSize: 12, opacity: 0.9 }}>Rejected — {bottomHeaderReason}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="frame frame--right-top" aria-label="right-top">
            {(() => {
              const back = () => { setPinnedLive(false); setNotationCursor((i) => Math.max(0, i - 1)); };
              const fwd = () => { setNotationCursor((i) => { const next = Math.min(sanList.length - 1, i + 1); setPinnedLive(next >= sanList.length - 1); return next; }); };
              const start = () => { setPinnedLive(false); setNotationCursor(0); };
              const end = () => { setPinnedLive(true); setNotationCursor(Math.max(0, sanList.length - 1)); };
              // Build pairs like the real UI
              const pairs = [] as Array<{ moveNumber: number; white?: string; black?: string }>;
              for (let i = 0; i < sanList.length; i += 2) {
                pairs.push({ moveNumber: Math.floor(i / 2) + 1, white: sanList[i], black: sanList[i + 1] });
              }
              const latestIndex = Math.max(0, pairs.length - 1);
              const activePairIndex = Math.max(0, Math.floor(notationCursor / 2));
              const renderCell = (san?: string, color?: 'white' | 'black', cellIndex?: number) => {
                if (!san) {
                  return (
                    <span className={[ 'notation-row__cell', 'notation-row__cell--placeholder', `notation-row__cell--${color}`].join(' ')} aria-hidden>—</span>
                  );
                }
                const isCellActive = cellIndex === notationCursor;
                return (
                  <button
                    type="button"
                    className={[ 'notation-row__cell', `notation-row__cell--${color}`, isCellActive ? 'is-active' : '' ].filter(Boolean).join(' ')}
                    onClick={() => { setPinnedLive(cellIndex === (sanList.length - 1)); setNotationCursor(cellIndex!); }}
                    onMouseEnter={() => handleMoveHoverStart(san)}
                    onFocus={() => handleMoveHoverStart(san)}
                    onMouseLeave={handleMoveHoverEnd}
                    onBlur={handleMoveHoverEnd}
                  >
                    <span className="notation-row__text">{san}</span>
                  </button>
                );
              };
              return (
                <div className="notation-rail" role="region" aria-label="Notation">
                  <div className="notation-rail__controls">
                    <button className="np-btn" onClick={start} aria-label="Go to start">⏮</button>
                    <button className="np-btn" onClick={back} aria-label="Step back">◀</button>
                    <button className="np-btn" onClick={fwd} aria-label="Step forward">▶</button>
                          <button className="np-btn" onClick={end} aria-label="Go to end">⏭</button>
                          <div className="np-spacer" />
                          <div className="np-status">{sanList.length ? (notationCursor + 1) : 0} / {sanList.length}</div>
                  </div>
                  <div ref={notationListRef} className="notation-rail__list" role="list" onMouseLeave={handleMoveHoverEnd}>
                    {pairs.length ? pairs.map((pair, idx) => {
                      const rowActive = idx === activePairIndex;
                      const rowLatest = idx === latestIndex;
                      const whiteIndex = idx * 2;
                      const blackIndex = whiteIndex + 1;
                      return (
                        <div key={`notation-row-${pair.moveNumber}`} className={[ 'notation-row', rowActive ? 'notation-row--active' : '', rowLatest ? 'notation-row--latest' : '' ].filter(Boolean).join(' ')}>
                          <span className="notation-row__number">{pair.moveNumber}.</span>
                          {renderCell(pair.white, 'white', whiteIndex)}
                          {renderCell(pair.black, 'black', blackIndex)}
                        </div>
                      );
                    }) : (
                      <div className="notation-row notation-row--empty">
                        <span className="notation-row__number">—</span>
                        <span className="notation-row__cell notation-row__cell--placeholder">Moves will appear here</span>
                        <span className="notation-row__cell notation-row__cell--placeholder" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="frame frame--right-bottom" aria-label="right-bottom" data-tour-id="receipts">
            {(() => {
              return (
                <div className="receipts-grid" role="table" aria-label="Wager receipts">
                  <div className="rg-head" role="row">
                    <div className="rg-cell rg-col-bet" role="columnheader">Bet</div>
                    <div className="rg-cell rg-col-stake" role="columnheader">Stake</div>
                    <div className="rg-cell rg-col-odds" role="columnheader">Odds</div>
                    <div className="rg-cell rg-col-status" role="columnheader">Status</div>
                  </div>
                  <div className="rg-body">
                    {(liveMode ? displayReceipts : []).map((w) => {
                      const type = w.wdl ? 'outcome' : 'move';
                      const label = w.wdl ? String(w.data) : String(w.data);
                      const oddsText = (() => {
                        if (w.wdl && w.mode === 'real' && w.status === 'won') return `x${(w.odds || 1).toFixed(2)}`;
                        if (!w.wdl && w.mode !== 'real') return `x${(w.odds || 1).toFixed(2)}`;
                        return '—';
                      })();
                      const id = String(w._id);
                      const classes = ['rg-row', `is-${String(w.status || '').toLowerCase()}`, `type-${type}`, enteringIds[id] ? 'is-entering' : '', updatedIds[id] ? 'is-updated' : ''].filter(Boolean).join(' ');
                      return (
                        <div key={w._id} className={classes} role="row">
                          <div className="rg-cell rg-col-bet" role="cell">
                            <span className={["rg-type-dot", type].join(' ')} aria-hidden />
                            <span className="rg-label" title={label}>{label}</span>
                          </div>
                          <div className="rg-cell rg-col-stake" role="cell">${Math.max(0, w.amount).toFixed(0)}</div>
                          <div className="rg-cell rg-col-odds" role="cell">{oddsText}</div>
                          <div className="rg-cell rg-col-status" role="cell">{String(w.status || 'pending')}</div>
                        </div>
                      );
                    })}
                    {(!liveMode || !displayReceipts.length) && (
                      <div className="rg-row is-empty" role="row">
                        <div className="rg-cell rg-col-bet" role="cell">No wagers</div>
                        <div className="rg-cell rg-col-stake" role="cell">—</div>
                        <div className="rg-cell rg-col-odds" role="cell">—</div>
                        <div className="rg-cell rg-col-status" role="cell">—</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="frame frame--bar" aria-label="info-bar">
            {(() => {
              const viewers = 128;
              const modeLabel = mode === 'real' ? 'USDT' : 'KBITZ';
              const [showChat, setShowChat] = useState(false);
              const [showLeaders, setShowLeaders] = useState(false);
              const [showDev, setShowDev] = useState(false);
              const moveNum = (Array.isArray(game?.move_hist) ? game!.move_hist.length : 0) + 1;
              const pMap = (game as any)?.odds || {};
              const pWhite = Number(pMap.white_win || 0);
              const pDraw = Number(pMap.draw || 0);
              const pBlack = Number(pMap.black_win || 0);
              const wArcadeX = pWhite > 0 ? Math.max(1, Math.round((1 / pWhite) * 10) / 10) : null;
              const dArcadeX = pDraw > 0 ? Math.max(1, Math.round((1 / pDraw) * 10) / 10) : null;
              const bArcadeX = pBlack > 0 ? Math.max(1, Math.round((1 / pBlack) * 10) / 10) : null;
              const wRealX = pWhite > 0 ? realWdlMultiplier('white_win', pWhite, moveNum, risk as any) : null;
              const dRealX = pDraw > 0 ? realWdlMultiplier('draw', pDraw, moveNum, risk as any) : null;
              const bRealX = pBlack > 0 ? realWdlMultiplier('black_win', pBlack, moveNum, risk as any) : null;
              const showWhiteX = mode === 'arcade' ? wArcadeX : wRealX;
              const showDrawX = mode === 'arcade' ? dArcadeX : dRealX;
              const showBlackX = mode === 'arcade' ? bArcadeX : bRealX;

              // Use outer handlePlaceWdlBet bound to header/toolbar origin and full odds logic
              return (
                <div className="match-bottom-bar" role="toolbar" aria-label="Quick actions">
                  <div className="bt-left">
                    <div className="bt-mode" title="Current mode" aria-label="Current mode">
                      {modeLabel}
                    </div>
                    {presets.map((v) => (
                      <button
                        key={`stake-${v}`}
                        className={`bt-chip ${stake === v ? 'is-active' : ''}`}
                        onClick={() => setStake(v)}
                        aria-pressed={stake === v}
                      >
                        ${v}
                      </button>
                    ))}
                    {(() => {
                      const goLive = () => { setPinnedLive(true); setNotationCursor(Math.max(0, sanList.length - 1)); };
                      if (isGameInProgress) {
                        if (isAtLatestSnapshot) {
                          return (
                            <span className="bt-live is-live" aria-label="Live">
                              <span className="dot" aria-hidden />
                              Live
                            </span>
                          );
                        }
                        return (
                          <button className="bt-live is-paused" onClick={goLive} aria-label="Go live">
                            <span className="dot" aria-hidden />
                            Go Live
                          </button>
                        );
                      }
                      return (
                        <span className="bt-live is-final" aria-label="Final">
                          <span className="dot" aria-hidden />
                          Final
                        </span>
                      );
                    })()}
                  </div>
                  <div className="bt-center">
                    {barMessage && (
                      <div className="bt-status" role="status" aria-live="polite" style={{ marginRight: 12, fontSize: 12, opacity: 0.9 }}>
                        {barMessage}
                      </div>
                    )}
                    <button
                      className="bt-draw outcome-action"
                      data-tour-id="draw-button"
                      disabled={!(pDraw > 0) || !bettingEnabled}
                      onClick={() => { if (bettingEnabled) handlePlaceWdlBet('draw', 'toolbar'); }}
                      title={bettingEnabled ? (drawX ? `Draw x${drawX.toFixed(2)}` : 'Draw') : 'Go Live to place bets'}
                    >
                      {drawX ? `Draw x${drawX.toFixed(2)}` : 'Draw'}
                    </button>
                  </div>
                  <div className="bt-right">
                    <div className="bt-viewers" title="Viewers" aria-label="Viewers">
                      <span className="icon" aria-hidden>👁</span>
                      <span className="count">{viewers}</span>
                    </div>
                    <button className="bt-icon" aria-label="Open chat" title="Open chat" onClick={() => { setShowChat((v) => !v); setShowLeaders(false); }}>
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="bt-icon" aria-label="Open leaderboard" title="Open leaderboard" onClick={() => { setShowLeaders((v) => !v); setShowChat(false); }}>
                      <FontAwesomeIcon icon={faTrophy} />
                    </button>
                    <button className="bt-icon" aria-label="Open dev tools" title="Open dev tools" onClick={() => { setShowDev((v) => !v); setShowChat(false); setShowLeaders(false); }}>
                      <FontAwesomeIcon icon={faWrench} />
                    </button>
                    {showChat && (
                      <div className="bt-popover chat" role="dialog" aria-label="Chat">
                        <div className="bt-popover__title">Chat (placeholder)</div>
                        <div className="bt-popover__body">Coming soon…</div>
                      </div>
                    )}
                    {showLeaders && (
                      <div className="bt-popover leaders" role="dialog" aria-label="Leaderboard">
                        <div className="bt-popover__title">Leaderboard (placeholder)</div>
                        <div className="bt-popover__body">Top bettors and results…</div>
                      </div>
                    )}
                    {showDev && (
                      <div className="bt-popover dev" role="dialog" aria-label="Dev tools">
                        <div className="bt-popover__title">Dev Tools</div>
                        <div className="bt-popover__body" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
                          <button className="np-btn" onClick={nextPosition} aria-label="Simulate next position">Next position</button>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
                            Auto advance
                          </label>
                          <hr style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} />
                            Follow featured match (auto)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
      <VersionFooter />
    </div>
  );
};

export default ChessMatch;

// Helpers local to the Test UI
function tinyCategoryGlyph(san: string): string {
  try {
    const s = String(san || '');
    if (!s) return '·';
    if (s.includes('#')) return '#';
    if (s.includes('+')) return '+';
    if (s.includes('x')) return '×';
    if (s.startsWith('O-O')) return '⟲';
    if (/^[NBRQK]/.test(s)) {
      const c = s[0];
      if (c === 'N') return 'N';
      if (c === 'B') return 'B';
      if (c === 'R') return 'R';
      if (c === 'Q') return 'Q';
      if (c === 'K') return 'K';
    }
    return '•';
  } catch { return '·'; }
}

function largeIconGlyph(san: string, side: 'w'|'b'): string {
  try {
    const s = String(san || '');
    if (!s) return '∿';
    if (s.includes('#') || s.includes('+')) return '⚠';
    if (s.includes('x')) return '◎';
    if (s.includes('=')) return '♕';
    if (s.startsWith('O-O')) return '⟲';
    if (/^[N]/.test(s)) return '∟';
    if (/^[B]/.test(s)) return '⟍';
    if (/^[R]/.test(s)) return '↔';
    if (/^[Q]/.test(s)) return '✦';
    if (/^[K]/.test(s)) return '◇';
    // Pawn push
    return side === 'w' ? '▲' : '▼';
  } catch { return '∿'; }
}

function moveTag(san: string, idx: number, scores: number[]): string | undefined {
  try {
    const s = String(san || '');
    if (s.includes('+') || s.includes('#')) return 'FORCING';
    const sorted = [...scores].sort((a, b) => b - a);
    const top = sorted[0] ?? 0;
    const second = sorted[1] ?? top;
    const isTop = scores[idx] === top;
    if (isTop && (top - second) >= 8) return 'ONLY';
    if (!s.includes('x') && !s.includes('+') && !s.includes('#')) return 'SAFE';
    return undefined;
  } catch { return undefined; }
}

function formatClockSafe(value?: number, timeFormat?: string): string {
  const parseInitialSeconds = (tf?: string): number | null => {
    if (!tf) return null;
    const base = String(tf).split('+')[0]?.trim();
    const mins = Number.parseInt(base, 10);
    return Number.isFinite(mins) && mins >= 0 ? mins * 60 : null;
  };
  const initialSecs = parseInitialSeconds(timeFormat);
  let seconds: number = Math.max(0, Number(value || 0));
  if (initialSecs != null) seconds = seconds > initialSecs * 10 ? Math.floor(seconds / 1000) : Math.floor(seconds);
  else seconds = seconds > 10000 ? Math.floor(seconds / 1000) : Math.floor(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function buildBoardConfig(game?: Game): Config {
  try {
    const fen = game?.state || undefined;
    let last: [Key, Key] | undefined;
    const hist = (game?.move_hist || []) as Move[];
    if (fen && hist.length) {
      const mv = hist[hist.length - 1];
      last = [mv.from as Key, mv.to as Key];
    }
    const cfg: Config = {
      orientation: 'white',
      coordinates: true,
      viewOnly: true,
      fen: fen as any,
      lastMove: last,
      highlight: { lastMove: true, check: true } as any,
      animation: { duration: 250 } as any,
      draggable: { showGhost: true } as any,
      movable: { free: false, color: 'both' } as any,
    };
    return cfg;
  } catch {
    return {
      orientation: 'white',
      coordinates: true,
      viewOnly: true,
      highlight: { lastMove: true, check: true } as any,
      animation: { duration: 200 } as any,
      draggable: { showGhost: true } as any,
      movable: { free: false, color: 'both' } as any,
    } as Config;
  }
}
