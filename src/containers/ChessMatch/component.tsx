import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom';
import ChessgroundWrapper from 'components/ChessgroundWrapper';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import { Key, MoveMetadata } from 'chessground/types';
import { Chess, Square } from 'chess.js';
import NavBar from 'components/NavBar';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import MiniLeaderboard from 'components/BettingSidebar/MiniLeaderboard';
import { preloadPieces } from 'utils/imagePreload';
import ChatBox from 'components/ChatBox';
import ConnectionStatus from 'components/ConnectionStatus';
import OnboardingGate from 'components/OnboardingGate';
import PregameModal from 'components/PregameModal';
import GameEndOverlay from 'components/GameEndOverlay';
import EvaluationBar from './EvaluationBar';
import { ROOT_URL } from 'utils';
import { getMoveAnalysis, getTopMoves, getBatchMoveAnalysis, MoveAnalysis } from 'store/requests/analysisRequests';
import { getRealWdlMarket, RealWdlMarketResponse } from 'store/requests';
import { computeArcadeMoveOdds } from 'utils/pricing';
import { isAnalysisRateLimited } from 'store/requests';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import {
  fetchGameById,
  fetchGameStats,
  setPendingBet,
  clearPendingBet,
  toggleQuickBet,
} from 'store/actionCreators/gameActionCreators';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { useMode } from 'context/ModeContext';
import { gameInProgress, gameOver, getValidMoves, getMultiplier } from 'utils/chess';
import { Game, GameOdds, GameStatus } from 'types/resources/game';
import { Rank } from 'types/leaderboard';
import { RootState } from 'types/state';
import { Wager, WagerStatus } from 'types/resources/wager';
import { fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.scss';
import './dark-style.scss';
import './evaluation-bar.scss';
import './bottom-toolbar.scss';
import BottomToolbar from './BottomToolbar';
// Removed legacy GameInfoPanel styles

interface ChessMatchProps {
  joinGame: typeof joinGame;
  leaveGame: typeof leaveGame;
  fetchGameById: typeof fetchGameById;
  fetchGameStats: typeof fetchGameStats;
  createWager: typeof createWager;
  setPendingBet: typeof setPendingBet;
  clearPendingBet: typeof clearPendingBet;
  toggleQuickBet: typeof toggleQuickBet;
  onEnterMovePanel: () => void;
  onLeaveMovePanel: () => void;
  onMoveHover: (shapes: Array<{ orig: string; dest: string }>) => void;
  onMoveUnhover: () => void;
  getGameLeaderboard: (gameId: string) => void;
  games: Record<string, Game>;
  gameStats: Record<string, any>;
  showModal: Record<string, boolean>;
  config: Config;
  autoShapes: DrawShape[];
  showAutoShapes: boolean;
  isAuthenticated: boolean;
  balance: number | undefined;
  tokenBalance?: number;
  cashBalance?: number;
  rankings: Rank[];
  quickBetMode: boolean;
  pendingBet: {
    moveString: string;
    stake: number;
    gameId: string;
    isActive: boolean;
  } | null;
  resolvedWagers: any[];
}

interface Snapshot {
  fen: string;
  label: string;
  eval: number;
  lastMove?: [Key, Key];
  turn: 'w' | 'b';
}

type OutcomeId = 'black_win' | 'draw' | 'white_win';
type OutcomeVisualState = 'idle' | 'loading' | 'success' | 'error';
type MoveVisualState = 'idle' | 'loading' | 'success' | 'error';

type HoverableColor = 'white' | 'black';

interface MoveOption {
  move: string;
  percent: number;
  payout: number;
  wagered: number;
}

interface NotationEntry {
  index: number;
  label: string;
  eval: number;
}

interface NotationPair {
  moveNumber: number;
  white?: NotationEntry;
  black?: NotationEntry;
}

const MIN_BOARD_SIZE = 350;
// Phase 1 (logic-only) dev toggles: keep defaults off to preserve behavior
const ENABLE_RESIZE_SNAP = true;
const BOARD_SNAP_INCREMENT = 20; // only used when ENABLE_RESIZE_SNAP is true
const ENABLE_RESIZE_DEBUG = false;
// If set (non-null), overrides computed max board size. Leave null to keep existing behavior.
const DEV_FORCE_MAX_BOARD_SIZE: number | null = null;
// Stage 2 prototype flags
// Centered moves layout is now the default
const STAKE_PRESETS = [10, 25, 50, 100, 250];
const OUTCOME_LABELS: Record<OutcomeId, string> = {
  black_win: 'Black',
  draw: 'Draw',
  white_win: 'White',
};
const OUTCOME_SEQUENCE: OutcomeId[] = ['black_win', 'draw', 'white_win'];
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PIECE_SYMBOLS: Record<string, { white: string; black: string }> = {
  K: { white: '♔', black: '♚' },
  Q: { white: '♕', black: '♛' },
  R: { white: '♖', black: '♜' },
  B: { white: '♗', black: '♝' },
  N: { white: '♘', black: '♞' },
};

// Heuristic clock formatter that accepts seconds or milliseconds.
// Uses game time_format (e.g., "3+2") when available to infer units reliably.
const parseInitialSeconds = (timeFormat?: string): number | null => {
  if (!timeFormat) return null;
  const base = String(timeFormat).split('+')[0]?.trim();
  const mins = Number.parseInt(base, 10);
  if (Number.isFinite(mins) && mins >= 0) return mins * 60;
  return null;
};

const formatClock = (value: number, timeFormat?: string) => {
  const initialSecs = parseInitialSeconds(timeFormat);
  let seconds: number;

  if (initialSecs != null) {
    // If value is much larger than plausible seconds for this control,
    // treat as milliseconds. The factor 10 gives headroom for increments.
    seconds = value > initialSecs * 10 ? Math.floor(value / 1000) : Math.floor(value);
  } else {
    // Fallback heuristic: large values are milliseconds.
    seconds = value > 10000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  seconds = Math.max(0, seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const computeEvalFromOdds = (odds?: GameOdds) => {
  if (!odds) return 0;
  const white = Math.max(0, odds.white_win ?? 0);
  const black = Math.max(0, odds.black_win ?? 0);
  const total = white + black;
  if (total === 0) return 0;
  const normalizedDiff = (white - black) / total;
  return Math.max(-1, Math.min(1, normalizedDiff));
};

// Very lightweight fallback evaluator from a FEN using material count only.
// This is not an engine, but provides a sensible signal when rewound.
const approximateOddsFromFen = (fen?: string): GameOdds | undefined => {
  if (!fen) return undefined;
  const [board] = fen.split(' ');
  if (!board) return undefined;
  // Piece values
  const val: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let white = 0;
  let black = 0;
  for (const ch of board) {
    if (ch === '/') continue;
    if (/[1-8]/.test(ch)) continue;
    const lower = ch.toLowerCase();
    const v = val[lower] ?? 0;
    if (ch === lower) black += v; else white += v;
  }
  const diff = white - black; // positive means white has material edge
  // Squash to [-1, 1]
  const norm = Math.tanh(diff / 8);
  // Allocate a small constant draw bucket to keep bar informative
  const draw = 0.12;
  const whiteNoDraw = (norm + 1) / 2; // 0..1
  const white_win = Math.max(0, Math.min(1, whiteNoDraw * (1 - draw)));
  const black_win = Math.max(0, Math.min(1, (1 - whiteNoDraw) * (1 - draw)));
  // Normalize in case of rounding
  const sum = white_win + black_win + draw;
  return {
    white_win: white_win / sum,
    draw: draw / sum,
    black_win: black_win / sum,
  } as GameOdds;
};

const ChessMatch: React.FC<ChessMatchProps> = (props) => {
  const { mode } = useMode();
  const history = useHistory();
  const { id: gameId } = useParams<{ id: string }>();
  const { isMobile, isDesktop } = useResponsiveLayout();
  const dispatch = useDispatch();
  const groundWrapperRef = useRef<HTMLDivElement>(null);
  const boardFrameRef = useRef<HTMLDivElement | null>(null);
  const outcomeResetTimers = useRef<Record<OutcomeId, number | null>>({
    black_win: null,
    draw: null,
    white_win: null,
  });
  // Safety timers to ensure we never get stuck in a loading visual state
  const outcomeLoadingSafety = useRef<Record<OutcomeId, number | null>>({
    black_win: null,
    draw: null,
    white_win: null,
  });
  const moveResetTimers = useRef<Record<string, number | null>>({});
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    startSize: 420,
    anchorTop: null as number | null,
  });

  const [selectedStake, setSelectedStake] = useState<number>(25);
  const [activeOverlay, setActiveOverlay] = useState<'chat' | 'leaderboard' | null>(null);
  const [boardSize, setBoardSize] = useState(420);
  const [maxBoardSize, setMaxBoardSize] = useState(420);
  // Keep a proportional relationship between the user's chosen size and the
  // available maximum so window resizes feel equivalent to dragging the handle.
  const [sizeRatio, setSizeRatio] = useState(1); // 0..1 (1 = use max)
  const [positionIndex, setPositionIndex] = useState(0);
  // Unified selection across desktop + mobile move menus (for preview/highlight)
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverArrow, setHoverArrow] = useState<[string, string] | null>(null);
  // Per-candidate move quality (from microservice)
  const [moveAnalysisBySan, setMoveAnalysisBySan] = useState<Record<string, MoveAnalysis>>({});
  const [isMoveAnalysisLoading, setIsMoveAnalysisLoading] = useState(false);
  const [outcomeStates, setOutcomeStates] = useState<Record<OutcomeId, OutcomeVisualState>>({
    black_win: 'idle',
    draw: 'idle',
    white_win: 'idle',
  });
  const [moveStates, setMoveStates] = useState<Record<string, MoveVisualState>>({});
  const [isFollowingLive, setIsFollowingLive] = useState(true);
  const [isNotationHovered, setIsNotationHovered] = useState(false);
  const notationListRef = useRef<HTMLDivElement | null>(null);
  const notationCellRefs = useRef<Record<number, HTMLElement | null>>({});
  // Real-time ticking clocks (seconds)
  const [displayWhiteSecs, setDisplayWhiteSecs] = useState<number>(0);
  const [displayBlackSecs, setDisplayBlackSecs] = useState<number>(0);
  // Real market prices (Phase 1: read-only)
  const [realPrices, setRealPrices] = useState<{ white: number; draw: number; black: number } | null>(null);

  const {
    fetchGameById,
    fetchGameStats,
    joinGame,
    leaveGame,
    getGameLeaderboard,
    createWager,
    setPendingBet,
    clearPendingBet,
    onEnterMovePanel,
    onMoveHover,
    onMoveUnhover,
    quickBetMode,
    autoShapes,
    config: chessgroundConfig,
    isAuthenticated,
    showModal,
    rankings,
    resolvedWagers,
    games,
    gameStats: gameStatsMap,
  } = props;

  const game: Game | undefined = games[gameId];
  const gameStats = gameStatsMap[gameId];
  const viewerCount = gameStats?.viewerCount || 0;

  useEffect(() => {
    fetchGameById(gameId);
    fetchGameStats(gameId);
    joinGame(gameId);
    getGameLeaderboard(gameId);
    return () => { leaveGame(gameId); };
  }, []);

  const connectionState = useSelector((state: RootState) => state.socket.connectionState);
  useEffect(() => {
    // WS-aware polling: only poll when socket is not healthy
    if (connectionState === 'connected') return;
    const interval = setInterval(() => {
      fetchGameById(gameId);
      fetchGameStats(gameId);
      getGameLeaderboard(gameId);
    }, 15000);
    return () => clearInterval(interval);
  }, [connectionState, fetchGameById, fetchGameStats, getGameLeaderboard, gameId]);

  // Preload and pre-decode piece icons once on mount to avoid flicker
  useEffect(() => {
    preloadPieces();
  }, []);

  // Fetch Real market prices when in real mode
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (mode !== 'real' || !gameId) { setRealPrices(null); return; }
      try {
        const resp = await getRealWdlMarket(gameId);
        if (!cancelled && resp?.data?.prices) setRealPrices(resp.data.prices);
      } catch {
        if (!cancelled) setRealPrices(null);
      }
    };
    load();
    // Light polling to keep prices fresh when sockets are disconnected
    const id = window.setInterval(load, 15000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [mode, gameId]);

  const isGameInProgress = useMemo(() => (
    game ? gameInProgress(game.game_status as GameStatus) : false
  ), [game?.game_status]);
  // Consider betting allowed for any active game (not over), even if not yet in_progress
  const isGameActive = useMemo(() => (
    game ? !gameOver(game.game_status as GameStatus) : false
  ), [game?.game_status]);

  // After game ends, refetch wager history to ensure Real WDL pool shares are reflected
  useEffect(() => {
    if (!game) return;
    if (gameOver(game.game_status as GameStatus)) {
      const id = window.setTimeout(() => {
        dispatch(fetchWagerHistory(undefined, 10, 0));
      }, 800);
      return () => window.clearTimeout(id);
    }
  }, [game?.game_status, dispatch]);

  useEffect(() => {
    const computeMax = () => {
      if (DEV_FORCE_MAX_BOARD_SIZE != null) return DEV_FORCE_MAX_BOARD_SIZE;
      if (typeof window === 'undefined') return 420;
      const widthBound = window.innerWidth - 80;
      const heightBound = window.innerHeight - 220;
      return Math.max(MIN_BOARD_SIZE, Math.min(640, widthBound, heightBound));
    };
    const handler = () => {
      const nextMax = computeMax();
      setMaxBoardSize(nextMax);
      // Recompute board size from the user's chosen ratio so shrinking/expanding
      // the window behaves like dragging the handle proportionally.
      const desired = Math.max(MIN_BOARD_SIZE, Math.min(nextMax, Math.round(nextMax * sizeRatio)));
      const snapped = ENABLE_RESIZE_SNAP
        ? Math.round(desired / BOARD_SNAP_INCREMENT) * BOARD_SNAP_INCREMENT
        : desired;
      setBoardSize(snapped);
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [sizeRatio]);

  const snapshots = useMemo<Snapshot[]>(() => {
    const chess = new Chess();
    const initial: Snapshot[] = [{
      fen: chess.fen(),
      label: 'Starting Position',
      eval: computeEvalFromOdds(game?.odds),
      lastMove: undefined,
      turn: chess.turn(),
    }];

    (game?.move_hist ?? []).forEach((move, index) => {
      try {
        const promotionMatch = move.san?.match(/=([QRBN])/i);
        const promotion = promotionMatch ? promotionMatch[1].toLowerCase() : undefined;
        const result = chess.move({
          from: move.from as Square,
          to: move.to as Square,
          promotion: (promotion as any) ?? 'q',
        });
        if (result) {
          initial.push({
            fen: chess.fen(),
            label: move.san || `Move ${index + 1}`,
            eval: computeEvalFromOdds(game?.odds),
            lastMove: [result.from as Key, result.to as Key],
            turn: chess.turn(),
          });
        }
      } catch (error) {
        console.warn('Unable to build snapshot for move', move, error);
      }
    });

    if (game?.state && initial.length) {
      initial[initial.length - 1] = {
        ...initial[initial.length - 1],
        fen: game.state,
      };
    }

    return initial;
  }, [game?.move_hist, game?.state, game?.odds]);

  const latestSnapshotIndex = useMemo(() => (
    Math.max(0, snapshots.length - 1)
  ), [snapshots.length]);

  useEffect(() => {
    setPositionIndex((prev) => {
      const bounded = Math.min(prev, latestSnapshotIndex);
      return isFollowingLive ? latestSnapshotIndex : bounded;
    });
  }, [isFollowingLive, latestSnapshotIndex]);

  const activeSnapshot = snapshots[positionIndex] ?? snapshots[0];
  const isAtLatestSnapshot = positionIndex === latestSnapshotIndex;
  // Consider the UI effectively live while we are following live, to avoid
  // brief flicker when a new snapshot arrives and positionIndex updates.
  const isEffectivelyLive = isFollowingLive || isAtLatestSnapshot;
  const betsLocked = !isEffectivelyLive;
  // During migration, prefer the max of token_balance and legacy account to avoid 0 overshadowing a real balance
  const arcadeBalance = Math.max(0, (props.tokenBalance ?? props.balance ?? 0));
  const availableBalance = mode === 'real' ? (props.cashBalance ?? 0) : arcadeBalance;
  const hasSufficientBalance = availableBalance >= (selectedStake || 0);
  // Attempt criteria (auth handled in handlers with redirect)
  const canAttemptWager = !betsLocked && !!selectedStake && isGameActive;

  // (debug logging removed)

  const arrowShapes = useMemo(() => {
    const baseShapes = autoShapes || [];
    if (!hoverArrow) return baseShapes;
    return [
      ...baseShapes,
      {
        orig: hoverArrow[0] as Key,
        dest: hoverArrow[1] as Key,
        brush: 'green',
      },
    ];
  }, [autoShapes, hoverArrow]);

  // Eval bar uses live odds directly via EvaluationBar

  // Initialize display clocks when server-provided times change or turn flips
  useEffect(() => {
    if (!game) return;
    const baseWhite = Math.max(0, game?.time_white ?? 0);
    const baseBlack = Math.max(0, game?.time_black ?? 0);

    const toSecs = (raw: number): number => {
      const initialSecs = parseInitialSeconds(game?.time_format ?? undefined);
      if (initialSecs != null) return raw > initialSecs * 10 ? Math.floor(raw / 1000) : Math.floor(raw);
      return raw > 10000 ? Math.floor(raw / 1000) : Math.floor(raw);
    };

    const whiteBaseSecs = toSecs(baseWhite);
    const blackBaseSecs = toSecs(baseBlack);

    // Use server-provided values directly; the ticker will handle real-time decay
    setDisplayWhiteSecs(whiteBaseSecs);
    setDisplayBlackSecs(blackBaseSecs);
  }, [game?.time_white, game?.time_black, game?.time_format, activeSnapshot?.turn]);

  // Ticking effect – decrement active side every second when live and in progress
  useEffect(() => {
    if (!game) return undefined;
    if (!isAtLatestSnapshot || !isGameInProgress) return undefined;
    const isWhiteActive = activeSnapshot?.turn === 'w';
    const id = window.setInterval(() => {
      if (isWhiteActive) {
        setDisplayWhiteSecs((s) => Math.max(0, s - 1));
      } else {
        setDisplayBlackSecs((s) => Math.max(0, s - 1));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [game?._id, activeSnapshot?.turn, isAtLatestSnapshot, isGameInProgress]);

  const whiteClock = formatClock(displayWhiteSecs, game?.time_format);
  const blackClock = formatClock(displayBlackSecs, game?.time_format);
  const isWhiteTurn = activeSnapshot?.turn === 'w';
  const isBlackTurn = !isWhiteTurn;
  const isTurnHighlightEnabled = isAtLatestSnapshot && isGameInProgress;
  const { pricingVersion } = useMode();
  const squareSize = boardSize / 8;
  const evalBarWidth = Math.max(14, squareSize / 2);
  const BOARD_STACK_GAP = 4;

  // Overlay controls
  const openChat = useCallback(() => setActiveOverlay('chat'), []);
  const openLeaderboard = useCallback(() => setActiveOverlay('leaderboard'), []);
  const closeOverlay = useCallback(() => setActiveOverlay(null), []);

  useEffect(() => {
    if (!activeOverlay) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOverlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeOverlay, closeOverlay]);
  const FRAME_HORIZONTAL_PADDING = 8;
  const boardStackWidth = boardSize + evalBarWidth + BOARD_STACK_GAP;
  const boardFrameWidth = boardStackWidth + FRAME_HORIZONTAL_PADDING;

  // Canonicalize a SAN string for stable lookup (strip trailing +/#)
  const canonicalSan = useCallback((s: string | null | undefined) => (
    (s || '').replace(/[+#]$/g, '')
  ), []);

  // Cache move analysis per snapshot index to avoid re-fetch and flicker when scrubbing
  const [analysisByIndex, setAnalysisByIndex] = useState<Record<number, Record<string, MoveAnalysis>>>({});
  const analysisFetchInFlight = useRef<Set<number>>(new Set());

  const fetchTopMovesForIndex = useCallback(async (index: number) => {
    if (!snapshots[index]) return;
    if (analysisByIndex[index]) return; // already have cached data
    if (analysisFetchInFlight.current.has(index)) return;
    const fen = snapshots[index].fen;
    if (!fen) return;
    if (isAnalysisRateLimited()) return;
    analysisFetchInFlight.current.add(index);
    try {
      const resp = await getTopMoves(fen, 12);
      const arr = Array.isArray(resp?.data) ? resp.data : [];
      const map: Record<string, MoveAnalysis> = {};
      for (const item of arr) {
        if (item && typeof item === 'object' && item.move) {
          const key = canonicalSan(String(item.move));
          map[key] = {
            move: String(item.move),
            score: Number(item.score || 0),
            percentile: Number(item.percentile || 0),
            is_best_move: Boolean(item.is_best_move),
          } as MoveAnalysis;
          // Also populate global map keyed by fen::san for quick lookups elsewhere
          setMoveAnalysisBySan((prev) => ({
            ...prev,
            [analysisKey(fen, String(item.move))]: map[key],
          }));
        }
      }
      if (Object.keys(map).length) {
        setAnalysisByIndex((prev) => (prev[index] ? prev : { ...prev, [index]: map }));
      }
    } catch {}
    finally {
      analysisFetchInFlight.current.delete(index);
    }
  }, [canonicalSan, snapshots]);

  const deriveMoveOptions = useMemo<MoveOption[]>(() => {
    const fen = activeSnapshot?.fen || game?.state || DEFAULT_FEN;
    // 1) Prefer cached analysis for the current snapshot: top N by percentile
    const analyzed = analysisByIndex[positionIndex];
    let sanCandidates: string[] = [];
    if (analyzed && Object.keys(analyzed).length) {
      sanCandidates = Object.entries(analyzed)
        .sort((a, b) => ((b[1]?.percentile || 0) - (a[1]?.percentile || 0)))
        .map(([san]) => canonicalSan(san));
    } else {
      // 2) Fallback: live market options or legal moves for this FEN
      if (isAtLatestSnapshot && (game?.pool_wagers?.move?.options?.length)) {
        sanCandidates = (game.pool_wagers.move.options as string[]).map((s) => canonicalSan(s));
      } else {
        try {
          const chess = new Chess(fen);
          const legal = chess.moves({ verbose: true }) as Array<{ san: string }>;
          sanCandidates = Array.from(new Set(legal.map((m) => canonicalSan(String(m.san)))));
        } catch {
          sanCandidates = [];
        }
      }
    }
    // Limit to reasonable count; UI shows top 4 but we can compute extra
    const sanList = sanCandidates.slice(0, 8);

    // Compute market totals (for live view only)
    let totals: Record<string, number> = {};
    let poolTotal = 0;
    let fallbackPercent = 0;
    if (isAtLatestSnapshot) {
      const wagers = game?.pool_wagers?.move?.wagers ?? [];
      const opts = game?.pool_wagers?.move?.options ?? [];
      totals = {};
      wagers.forEach((entry) => {
        if (!entry?.data) return;
        const key = canonicalSan(String(entry.data));
        totals[key] = (totals[key] ?? 0) + (entry.amount ?? 0);
      });
      poolTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
      fallbackPercent = opts?.length ? 100 / opts.length : 0;
    }

    return sanList.map((san) => {
      const key = canonicalSan(san);
      const wagerTotal = totals[key] ?? 0;
      const percent = poolTotal ? (wagerTotal / poolTotal) * 100 : fallbackPercent;
      const payout = (poolTotal && wagerTotal)
        ? Math.max(1, poolTotal / wagerTotal)
        : (isAtLatestSnapshot ? (game?.pool_wagers?.move?.options?.length || 0) : 0);
      return { move: san, percent, payout, wagered: wagerTotal };
    });
  }, [
    activeSnapshot?.fen,
    game?.pool_wagers?.move,
    game?.state,
    isAtLatestSnapshot,
    analysisByIndex,
    positionIndex,
    canonicalSan,
  ]);

  const whiteMovePool = isWhiteTurn ? deriveMoveOptions : [];
  const blackMovePool = isBlackTurn ? deriveMoveOptions : [];
  const mobileMovePool = deriveMoveOptions;
  const mobileMoveOwner = isWhiteTurn ? game?.player_white : game?.player_black;
  // Build a stable analysis lookup key scoped to the current FEN
  const analysisKey = useCallback((fen: string, san: string) => (
    `${fen}::${canonicalSan(san)}`
  ), [canonicalSan]);

  // Convert an option move string to SAN for the current position, if possible
  const toSanForCurrent = useCallback((moveStr: string): string => {
    const fen = activeSnapshot?.fen || game?.state || DEFAULT_FEN;
    try {
      const chess = new Chess(fen);
      // Try sloppy parse to handle various notations (SAN/UCI/orig-dest)
      const mv = chess.move(String(moveStr), { sloppy: true } as any);
      if (mv && mv.san) {
        const san = String(mv.san);
        // Undo just to be safe for any subsequent ops (not strictly required here)
        chess.undo();
        return canonicalSan(san);
      }
    } catch {}
    return canonicalSan(moveStr);
  }, [activeSnapshot?.fen, game?.state, canonicalSan]);

  // Stable key for current position
  const fenKey = (activeSnapshot?.fen || game?.state || '').toString();

  // Top-moves fetched per index; FEN-based effect removed to avoid duplication.

  // Compute displayed candidate SANs (desktop + mobile) and ensure missing ones are fetched
  const displayedCandidateKeys = useMemo(() => {
    const list: string[] = [];
    const desktopWhite = (isWhiteTurn ? deriveMoveOptions : []).slice(0, 4);
    const desktopBlack = (isBlackTurn ? deriveMoveOptions : []).slice(0, 4);
    const mobile = deriveMoveOptions.slice(0, 4);
    for (const opt of [...desktopWhite, ...desktopBlack, ...mobile]) {
      if (!opt) continue;
      const sanKey = toSanForCurrent(opt.move);
      if (sanKey) list.push(sanKey);
    }
    return Array.from(new Set(list));
  }, [deriveMoveOptions, isBlackTurn, isWhiteTurn, toSanForCurrent]);

  // Compute Arcade fixed-odds for currently displayed candidate moves (top 4 per side + mobile)
  const arcadeOddsByMove = useMemo(() => {
    if (mode !== 'arcade') return {} as Record<string, number>;
    const offered = displayedCandidateKeys || [];
    const analyzed = analysisByIndex[positionIndex] || {};
    const topList: Array<{ move: string; score: number }> = Object.entries(analyzed).map(([san, a]) => ({ move: san, score: Number(a?.score || 0) }));
    return computeArcadeMoveOdds(offered, topList);
  }, [mode, displayedCandidateKeys, analysisByIndex, positionIndex]);

  const lastCandidateFetchAtRef = useRef(0);
  useEffect(() => {
    const fen = fenKey;
    if (!fen || !displayedCandidateKeys.length) return;
    // Throttle to avoid spamming for the same position during rapid re-renders
    const now = Date.now();
    if (now - lastCandidateFetchAtRef.current < 150) return;
    lastCandidateFetchAtRef.current = now;
    if (isAnalysisRateLimited()) return;
    // If candidate analyses are already cached for this index, skip fetching
    const cached = analysisByIndex[positionIndex] || {};
    const missing = displayedCandidateKeys.filter((k) => !cached[k] && !moveAnalysisBySan[analysisKey(fen, k)]);
    if (!missing.length) return;
    const run = async () => {
      try {
        const uniq = Array.from(new Set(missing)).slice(0, 4);
        const batch = await getBatchMoveAnalysis(fen, uniq);
        const arr = Array.isArray(batch?.data) ? batch.data : [];
        const additions: Record<string, MoveAnalysis> = {};
        for (let i = 0; i < uniq.length; i += 1) {
          const mv = arr[i];
          const san = uniq[i];
          if (mv && san) additions[analysisKey(fen, san)] = mv;
        }
        if (Object.keys(additions).length) {
          // Merge into global map and also index-scoped cache for smooth scrubbing
          setMoveAnalysisBySan((prev) => ({ ...prev, ...additions }));
          setAnalysisByIndex((prev) => {
            const current = prev[positionIndex] || {};
            const merged: Record<string, MoveAnalysis> = { ...current };
            Object.keys(additions).forEach((k) => {
              const [, san] = String(k).split('::');
              if (san) merged[canonicalSan(san)] = additions[k];
            });
            return { ...prev, [positionIndex]: merged };
          });
        }
      } catch {}
    };
    const timer = window.setTimeout(run, 300); // trailing debounce
    return () => window.clearTimeout(timer);
  }, [analysisKey, fenKey, displayedCandidateKeys, moveAnalysisBySan, analysisByIndex, positionIndex, canonicalSan]);

  const handleDragMove = useCallback((orig: Key, dest: Key, _metadata?: MoveMetadata) => {
    if (!game || betsLocked) return;
    if (!isAuthenticated) { history.push('/signin'); return; }
    const chess = new Chess(game.state);
    try {
      const move = chess.move({
        from: orig.toString() as any,
        to: dest.toString() as any,
        promotion: 'q',
      });
      if (!move) return;

      onEnterMovePanel();
      onMoveHover([{ orig: orig.toString(), dest: dest.toString() }]);

      if (quickBetMode && canAttemptWager && hasSufficientBalance) {
        const wagerPromise = createWager(
          gameId,
          move.san,
          selectedStake,
          false,
          1,
          game.move_hist.length + 1,
          mode,
          mode === 'real' ? 'USDT' : 'BET',
        );
        Promise.resolve(wagerPromise).then(() => {
          try { dispatch(fetchWagerHistory(undefined, 10, 0)); } catch (_) {}
        });
        window.setTimeout(() => {
          if (onMoveUnhover) onMoveUnhover();
        }, 1000);
      } else {
        clearPendingBet();
        setPendingBet({
          moveString: move.san,
          stake: selectedStake,
          gameId,
          isActive: true,
        });
        window.setTimeout(() => {
          if (onMoveUnhover) onMoveUnhover();
        }, 2000);
      }

      chess.undo();
    } catch (error) {
      // keep failure path minimal
    }
  }, [betsLocked, canAttemptWager, clearPendingBet, createWager, game, gameId, history, isAuthenticated, onEnterMovePanel, onMoveHover, onMoveUnhover, quickBetMode, selectedStake, setPendingBet, hasSufficientBalance]);

  // Store odds history keyed by snapshot index so eval bar follows notation
  const [oddsByIndex, setOddsByIndex] = useState<Record<number, GameOdds>>({});

  // Whenever odds update, capture them for the latest snapshot index.
  useEffect(() => {
    if (!game?.odds) return;
    const idx = latestSnapshotIndex;
    setOddsByIndex((prev) => {
      const existing = prev[idx];
      const next = game.odds as GameOdds;
      if (!existing || existing.white_win !== next.white_win || existing.black_win !== next.black_win || existing.draw !== next.draw) {
        return { ...prev, [idx]: next };
      }
      return prev;
    });
  }, [game?.odds, latestSnapshotIndex]);

  // Ensure analysis is cached for the current and latest positions
  useEffect(() => { fetchTopMovesForIndex(positionIndex); }, [positionIndex, fetchTopMovesForIndex]);
  useEffect(() => { fetchTopMovesForIndex(latestSnapshotIndex); }, [latestSnapshotIndex, fetchTopMovesForIndex]);

  // Ensure new indices get an initial odds entry
  useEffect(() => {
    if (!game?.odds) return;
    setOddsByIndex((prev) => (prev[latestSnapshotIndex] ? prev : { ...prev, [latestSnapshotIndex]: game.odds as GameOdds }));
  }, [latestSnapshotIndex]);

  // (debug logging removed)

  const boardConfig = useMemo<Config>(() => {
    const fen = activeSnapshot?.fen || game?.state || DEFAULT_FEN;
    const viewOnly = !isAtLatestSnapshot;
    const composedConfig: Config = {
      ...chessgroundConfig,
      fen,
      coordinates: true,
      viewOnly,
      orientation: 'white',
      lastMove: activeSnapshot?.lastMove,
      drawable: {
        enabled: true,
        visible: true,
        autoShapes: arrowShapes,
        defaultSnapToValidMove: true,
        eraseOnClick: false,
      },
      animation: { enabled: true, duration: 350 },
    };

    if (!viewOnly && game?.state) {
      composedConfig.movable = {
        free: false,
        color: 'both',
        dests: getValidMoves(game.state),
        rookCastle: true,
        events: {
          after: handleDragMove,
        },
      };
    }

    return composedConfig;
  }, [activeSnapshot?.fen, activeSnapshot?.lastMove, arrowShapes, chessgroundConfig, game?.state, handleDragMove, isAtLatestSnapshot]);

  const normalizeMoveNotation = useCallback((move: string) => (
    move
      .replace(/^[0-9]+\.{1,3}\s*/, '')
      .replace(/^\.{3}\s*/, '')
      .trim()
  ), []);

  const sanitizeMoveLabel = useCallback((move: string) => (
    normalizeMoveNotation(move).replace(/[?!]+$/g, '')
  ), [normalizeMoveNotation]);

  const computeArrowForMove = useCallback((move: string): [string, string] | null => {
    try {
      const chess = new Chess(activeSnapshot?.fen || game?.state || DEFAULT_FEN);
      const candidate = chess.move(normalizeMoveNotation(move), { sloppy: true });
      if (candidate) {
        return [candidate.from, candidate.to];
      }
    } catch (error) {
      console.warn('Unable to draw arrow for move', move, error);
    }
    return null;
  }, [activeSnapshot?.fen, game?.state, normalizeMoveNotation]);

  const getPieceTypeFromSAN = useCallback((san: string): 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' => {
    const raw = sanitizeMoveLabel(san);
    if (/^O-O/.test(raw)) return 'king';
    const lead = raw.charAt(0);
    switch (lead) {
      case 'K': return 'king';
      case 'Q': return 'queen';
      case 'R': return 'rook';
      case 'B': return 'bishop';
      case 'N': return 'knight';
      default: return 'pawn';
    }
  }, [sanitizeMoveLabel]);

  const getTargetSquareFromSAN = useCallback((san: string): string | null => {
    const raw = sanitizeMoveLabel(san).replace(/[+#!?]+$/g, '');
    if (/^O-O/.test(raw)) return raw; // show castle as-is
    const matches = raw.match(/[a-h][1-8]/g);
    const square = matches && matches.length ? matches[matches.length - 1] : null;
    if (!square) return null;
    const isCapture = /x/.test(raw);
    return isCapture ? `×${square}` : square;
  }, [sanitizeMoveLabel]);

  const handleMoveHoverStart = useCallback((move: string) => {
    const arrow = computeArrowForMove(move);
    setHoverArrow(arrow);
    if (arrow) {
      onMoveHover([{ orig: arrow[0] as string, dest: arrow[1] as string }]);
    }
  }, [computeArrowForMove, onMoveHover]);

  const handleMoveHoverEnd = useCallback(() => {
    setHoverArrow(null);
    onMoveUnhover();
  }, [onMoveUnhover]);

  useEffect(() => {
    setHoverArrow(null);
  }, [activeSnapshot?.fen]);

  const updateOutcomeState = useCallback((outcomeId: OutcomeId, next: OutcomeVisualState) => {
    setOutcomeStates((prev) => {
      if (prev[outcomeId] === next) return prev;
      return { ...prev, [outcomeId]: next };
    });
  }, []);

  // Wager receipts (simple, minimal panel below Notation)
  // Fetch a page on mount for historical continuity
  useEffect(() => {
    dispatch(fetchWagerHistory(undefined, 10, 0));
  }, [dispatch]);

  // Combine fast-updating local wagers (dictionary) with fetched history,
  // then filter to current game and sort by created time (desc)
  const allWagersMap = useSelector((state: RootState) => state.wager?.wagers ?? {});
  const authUserId = useSelector((state: RootState) => state.auth?.user?._id as string | undefined);
  const fetchedHistory = useSelector((state: RootState) => state.wager?.wagerHistory ?? []);
  const receipts = useMemo<Wager[]>(() => {
    const local = Object.values(allWagersMap) as Wager[];
    const merged = [...local, ...fetchedHistory];
    const seen: Record<string, boolean> = {};
    const filtered = merged.filter((w) => {
      if (!w || seen[w._id]) return false;
      seen[w._id] = true;
      if (w.game_id !== gameId) return false;
      // Filter by current mode: REAL shows only mode==='real'; ARCADE shows everything else
      const isRealWager = (w as any).mode === 'real';
      return mode === 'real' ? isRealWager : !isRealWager;
    });
    filtered.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return filtered.slice(0, 10);
  }, [allWagersMap, fetchedHistory, gameId]);

  // Lightweight local cache so receipts persist across refresh before network returns
  const [cachedReceipts, setCachedReceipts] = useState<Wager[]>([]);
  // Optimistic local pending receipts to show instant feedback
  const [pendingReceipts, setPendingReceipts] = useState<Wager[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const key = `betmate:receipts:${authUserId || 'anon'}:${gameId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCachedReceipts(parsed as Wager[]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write-through when fresh receipts arrive
  useEffect(() => {
    if (!receipts?.length) return;
    try {
      const key = `betmate:receipts:${authUserId || 'anon'}:${gameId}`;
      const dedup: Record<string, Wager> = {};
      receipts.forEach((w) => { dedup[w._id] = w; });
      const next = Object.values(dedup).slice(0, 20);
      setCachedReceipts(next);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }, [authUserId, gameId, receipts]);

  // Remove any optimistic entries only when a matching real counterpart exists.
  // Match on wdl/data/amount/move_number and time proximity to avoid false positives
  useEffect(() => {
    if (!pendingReceipts.length || !receipts.length) return;
    setPendingReceipts((prev) => prev.filter((p) => {
      const pTime = Date.parse(p.created_at || '');
      const lowerBound = Number.isFinite(pTime) ? pTime - 60000 : 0; // 60s grace window
      const matched = receipts.some((r) => (
        r.wdl === p.wdl &&
        String(r.data) === String(p.data) &&
        (r.amount ?? 0) === (p.amount ?? 0) &&
        (r.move_number ?? -1) === (p.move_number ?? -1) &&
        Date.parse(r.created_at || '') >= lowerBound
      ));
      return !matched;
    }));
  }, [receipts, pendingReceipts.length]);

  const displayReceipts = pendingReceipts.concat(
    (receipts.length ? receipts : cachedReceipts).filter((w) => (mode === 'real' ? (w as any).mode === 'real' : (w as any).mode !== 'real'))
  );

  // Draw backstop moved below scheduleOutcomeReset definition

  const formatReceiptLabel = useCallback((w: Wager) => {
    if (w.wdl) {
      const data = (w.data || '').toLowerCase();
      if (data.includes('white')) {
        const name = game?.player_white?.name || 'White';
        return `Outcome: ${name} (White)`;
      }
      if (data.includes('black')) {
        const name = game?.player_black?.name || 'Black';
        return `Outcome: ${name} (Black)`;
      }
      if (data.includes('draw')) return 'Outcome: Draw';
      // Fallbacks for legacy values like 'win'/'loss'
      if (data === 'win') return 'Outcome: Win';
      if (data === 'loss') return 'Outcome: Loss';
      return `Outcome: ${w.data}`;
    }
    return `Move: ${sanitizeMoveLabel(w.data)}`;
  }, [game?.player_black?.name, game?.player_white?.name, sanitizeMoveLabel]);

  const formatReceiptMeta = useCallback((w: Wager) => {
    const amount = `$${(w.amount ?? 0).toFixed(0)}`;
    let netPart = '';
    if (w.status === WagerStatus.WON) {
      const net = (w.amount * (w.odds || 1)) - w.amount;
      netPart = `Net +$${Math.abs(net).toFixed(0)}`;
    } else if (w.status === WagerStatus.LOST) {
      netPart = `Net -$${Math.abs(w.amount).toFixed(0)}`;
    } else if (w.status === WagerStatus.CANCELLED) {
      netPart = 'Refund';
    }
    return netPart ? `${amount} • ${netPart}` : `${amount}`;
  }, []);

  const scheduleOutcomeReset = useCallback((outcomeId: OutcomeId, delay: number) => {
    const timer = outcomeResetTimers.current[outcomeId];
    if (timer) window.clearTimeout(timer);
    const timerId = window.setTimeout(() => {
      updateOutcomeState(outcomeId, 'idle');
      outcomeResetTimers.current[outcomeId] = null;
    }, delay);
    outcomeResetTimers.current[outcomeId] = timerId;
  }, [updateOutcomeState]);

  

  const updateMoveState = useCallback((moveKey: string, next: MoveVisualState) => {
    setMoveStates((prev) => {
      if (prev[moveKey] === next) return prev;
      return { ...prev, [moveKey]: next };
    });
  }, []);

  const scheduleMoveReset = useCallback((moveKey: string, delay: number) => {
    const timer = moveResetTimers.current[moveKey];
    if (timer) window.clearTimeout(timer);
    const timerId = window.setTimeout(() => {
      updateMoveState(moveKey, 'idle');
      moveResetTimers.current[moveKey] = null;
    }, delay);
    moveResetTimers.current[moveKey] = timerId;
  }, [updateMoveState]);

  // Confirm success via receipts rather than optimistic UI
  useEffect(() => {
    // Outcomes
    (['black_win','white_win','draw'] as OutcomeId[]).forEach((outcomeId) => {
      if (outcomeStates[outcomeId] !== 'loading') return;
      const needle = outcomeId.includes('white') ? 'white' : outcomeId.includes('black') ? 'black' : 'draw';
      const found = receipts.some((w) => w.wdl && w.game_id === gameId && String(w.data).toLowerCase().includes(needle));
      if (found) {
        updateOutcomeState(outcomeId, 'success');
        scheduleOutcomeReset(outcomeId, 600);
      }
    });

    // Moves: if any move currently loading matches a receipt.data, mark success
    const loadingMoveKeys = Object.keys(moveStates).filter((k) => moveStates[k] === 'loading');
    if (loadingMoveKeys.length) {
      const moveSet = new Set(receipts.filter((w) => !w.wdl && w.game_id === gameId).map((w) => String(w.data)));
      loadingMoveKeys.forEach((key) => {
        const parts = key.split('-');
        const moveStr = parts.slice(1).join('-'); // original move may contain '-'
        if (moveSet.has(moveStr)) {
          updateMoveState(key, 'success');
          scheduleMoveReset(key, 500);
        }
      });
    }
  }, [receipts, gameId, outcomeStates, moveStates, scheduleOutcomeReset, scheduleMoveReset, updateOutcomeState, updateMoveState]);

  // If the wager request fails, show inline error on anything in loading state
  const createWagerRequest = useSelector((state: RootState) => state.requests?.['CREATE_WAGER']);
  useEffect(() => {
    if (!createWagerRequest) return;
    if (createWagerRequest.isLoading) return;
    if (!createWagerRequest.message) return; // no error -> ignore
    // Outcomes in loading -> error
    (['black_win','white_win','draw'] as OutcomeId[]).forEach((outcomeId) => {
      if (outcomeStates[outcomeId] === 'loading') {
        updateOutcomeState(outcomeId, 'error');
        scheduleOutcomeReset(outcomeId, 900);
      }
    });
    // Moves in loading -> error
    Object.keys(moveStates).forEach((key) => {
      if (moveStates[key] === 'loading') {
        updateMoveState(key, 'error');
        scheduleMoveReset(key, 900);
      }
    });
  }, [createWagerRequest, outcomeStates, moveStates, scheduleMoveReset, scheduleOutcomeReset, updateMoveState, updateOutcomeState]);

  const triggerOutcomeBet = useCallback(async (outcomeId: OutcomeId) => {
    if (!game) return;
    if (!isAuthenticated) { history.push('/signin'); return; }
    // Immediate guard for insufficient balance
    if (!hasSufficientBalance) {
      updateOutcomeState(outcomeId, 'error');
      scheduleOutcomeReset(outcomeId, 900);
      return;
    }
    if (!canAttemptWager || !hasSufficientBalance) return;
    // Prevent double submission using current render state snapshot
    if (outcomeStates[outcomeId] === 'loading') return;
    setOutcomeStates((prev) => ({ ...prev, [outcomeId]: 'loading' }));

    // Set a safety fallback so we never stay in loading forever
    if (outcomeLoadingSafety.current[outcomeId]) {
      window.clearTimeout(outcomeLoadingSafety.current[outcomeId]!);
    }
    outcomeLoadingSafety.current[outcomeId] = window.setTimeout(() => {
      updateOutcomeState(outcomeId, 'idle');
      outcomeLoadingSafety.current[outcomeId] = null;
    }, 4000);

    try {
      const wagerPromise = createWager(
        gameId,
        outcomeId,
        selectedStake,
        true,
        game.odds?.[outcomeId] ? 1 / game.odds[outcomeId] : 1,
        game.move_hist.length + 1,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      );
      // Mark button success immediately (snappy)
      updateOutcomeState(outcomeId, 'success');
      scheduleOutcomeReset(outcomeId, 600);

      await Promise.resolve(wagerPromise);
      if (outcomeLoadingSafety.current[outcomeId]) {
        window.clearTimeout(outcomeLoadingSafety.current[outcomeId]!);
        outcomeLoadingSafety.current[outcomeId] = null;
      }
      // Refresh receipts so new wagers appear promptly
      dispatch(fetchWagerHistory(undefined, 10, 0));
    } catch (error) {
      // keep failure path minimal
      updateOutcomeState(outcomeId, 'error');
      scheduleOutcomeReset(outcomeId, 800);
      if (outcomeLoadingSafety.current[outcomeId]) {
        window.clearTimeout(outcomeLoadingSafety.current[outcomeId]!);
        outcomeLoadingSafety.current[outcomeId] = null;
      }
    }
  }, [canAttemptWager, createWager, game, gameId, hasSufficientBalance, outcomeStates, scheduleOutcomeReset, selectedStake, updateOutcomeState, isAuthenticated, history]);

  const handleMoveBet = useCallback(async (move: string) => {
    if (!game) return;
    if (!isAuthenticated) { history.push('/signin'); return; }
    const moveKey = `${positionIndex}-${move}`;
    if (moveStates[moveKey] === 'loading') return;
    // Immediate guard for insufficient balance
    if (!hasSufficientBalance) {
      updateMoveState(moveKey, 'error');
      scheduleMoveReset(moveKey, 900);
      return;
    }
    if (!canAttemptWager || !hasSufficientBalance) return;
    updateMoveState(moveKey, 'loading');
    try {
      const clientOdds = mode === 'arcade' ? Number(arcadeOddsByMove[canonicalSan(move)] || 1) : 1;
      const wagerPromise = createWager(
        gameId,
        move,
        selectedStake,
        false,
        clientOdds,
        game.move_hist.length + 1,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      );
      // Immediate success state for tactile feedback
      updateMoveState(moveKey, 'success');
      scheduleMoveReset(moveKey, 500);

      await Promise.resolve(wagerPromise);
      // Refresh receipts so new wagers appear promptly
      dispatch(fetchWagerHistory(undefined, 10, 0));
    } catch (error) {
      // keep failure path minimal
      updateMoveState(moveKey, 'error');
      scheduleMoveReset(moveKey, 700);
    }
  }, [canAttemptWager, createWager, game, gameId, hasSufficientBalance, moveStates, positionIndex, scheduleMoveReset, selectedStake, updateMoveState, isAuthenticated, history, mode, arcadeOddsByMove, canonicalSan]);

  useEffect(() => () => {
    (Object.keys(outcomeResetTimers.current) as OutcomeId[]).forEach((outcomeId) => {
      const timer = outcomeResetTimers.current[outcomeId];
      if (timer) window.clearTimeout(timer);
    });
    (Object.keys(outcomeLoadingSafety.current) as OutcomeId[]).forEach((outcomeId) => {
      const timer = outcomeLoadingSafety.current[outcomeId];
      if (timer) window.clearTimeout(timer);
    });
    Object.values(moveResetTimers.current).forEach((timer) => {
      if (timer) window.clearTimeout(timer);
    });
  }, []);

  const renderMoveOptions = (options: MoveOption[], color: HoverableColor) => {
    if (!options.length) {
      return (
        <div className="move-panel__empty">No moves</div>
      );
    }

    return options.map((option) => {
      const moveKey = `${positionIndex}-${option.move}`;
      const visualState = moveStates[moveKey] ?? 'idle';
      const piece = getPieceTypeFromSAN(option.move);
      const dest = getTargetSquareFromSAN(option.move) || sanitizeMoveLabel(option.move);
      const wageredText = `${Math.max(0, Math.floor(option.wagered || 0))} wagered`;
      const sanKey = toSanForCurrent(option.move);
      const analysis = (analysisByIndex[positionIndex]?.[sanKey]) || moveAnalysisBySan[analysisKey(fenKey, sanKey)];
      const isBest = !!analysis?.is_best_move;
      const rawPct = analysis?.percentile;
      const percentile = (typeof rawPct === 'number' && Number.isFinite(rawPct)) ? Math.round(rawPct) : null;
      const qualityClass = isBest
        ? 'quality-best'
        : (percentile == null)
          ? 'quality-unknown'
          : (percentile >= 70 ? 'quality-strong' : (percentile >= 40 ? 'quality-decent' : 'quality-poor'));
      const pieceSrc = `/pieces_w/${piece}.png`;
      const isSelected = selectedMove === option.move;
      return (
        <button
          key={`${color}-${option.move}`}
          type="button"
          className={`move-option state-${visualState} ${isSelected ? 'is-selected' : ''}`}
          disabled={!canAttemptWager || !hasSufficientBalance}
          aria-disabled={!canAttemptWager || !hasSufficientBalance}
          data-locked={betsLocked || !isGameActive || !hasSufficientBalance}
          title={!hasSufficientBalance ? 'Insufficient balance' : undefined}
          onClick={() => {
            if (canAttemptWager && hasSufficientBalance) {
              handleMoveBet(option.move);
            } else {
              if (selectedMove !== option.move) {
                setSelectedMove(option.move);
                handleMoveHoverEnd();
                handleMoveHoverStart(option.move);
              }
            }
          }}
          onMouseEnter={() => handleMoveHoverStart(option.move)}
          onMouseLeave={handleMoveHoverEnd}
          onFocus={() => handleMoveHoverStart(option.move)}
          onBlur={handleMoveHoverEnd}
          onTouchStart={() => handleMoveHoverStart(option.move)}
          onTouchEnd={handleMoveHoverEnd}
          data-state={visualState}
        >
          <span className="move-option__left">
            <span className="move-option__icon" aria-hidden data-color={color}>
              <img src={pieceSrc} alt="" decoding="async" />
            </span>
            <span className="move-option__dest">{dest}</span>
            <span className={`move-option__quality ${qualityClass}`} aria-label={isBest ? 'Best move' : 'Move quality percentile'}>
              {analysis
                ? (percentile == null
                    ? (isBest ? '💪' : '—')
                    : (isBest ? `${percentile} 💪` : `${percentile}`))
                : '—'}
            </span>
          </span>
          <span className="move-option__meta">{wageredText}</span>
        </button>
      );
    });
  };

  const renderMovePanel = (
    color: HoverableColor,
    alignmentClass: 'move-panel--top' | 'move-panel--bottom' | 'move-panel--center',
    isActive: boolean,
    options: MoveOption[],
  ) => {
    const VISIBLE_DESKTOP_SLOTS = 4;
    const slots = Array.from({ length: VISIBLE_DESKTOP_SLOTS }, (_, i) => options[i] || null);

    return (
      <div
        className={[
          'move-panel',
          alignmentClass,
          isActive ? 'move-panel--expanded' : 'move-panel--collapsed',
        ].join(' ')}
        data-locked={false}
        aria-live={isActive ? 'polite' : 'off'}
      >
        {isActive ? (
          slots.map((option, idx) => {
            if (!option) {
              return (
                <div key={`slot-${color}-${idx}`} className="move-option move-option--placeholder" aria-hidden>
                  <span className="move-option__left">
                    <span className="move-option__icon" aria-hidden data-color={color} />
                    <span className="move-option__dest">—</span>
                  </span>
                  <span className="move-option__meta">&nbsp;</span>
                </div>
              );
            }
            const moveKey = `${positionIndex}-${option.move}`;
            const visualState = moveStates[moveKey] ?? 'idle';
            const piece = getPieceTypeFromSAN(option.move);
            const dest = getTargetSquareFromSAN(option.move) || sanitizeMoveLabel(option.move);
            const wageredText = `${Math.max(0, Math.floor(option.wagered || 0))} wagered`;
            const sanKey = toSanForCurrent(option.move);
            const analysis = (analysisByIndex[positionIndex]?.[sanKey]) || moveAnalysisBySan[analysisKey(fenKey, sanKey)];
            const isBest = !!analysis?.is_best_move;
            const rawPct = analysis?.percentile;
            const percentile = (typeof rawPct === 'number' && Number.isFinite(rawPct)) ? Math.round(rawPct) : null;
            const qualityClass = isBest
              ? 'quality-best'
              : (percentile == null)
                ? 'quality-unknown'
                : (percentile >= 70 ? 'quality-strong' : (percentile >= 40 ? 'quality-decent' : 'quality-poor'));
            const pieceSrc = `/pieces_w/${piece}.png`;
            const isSelected = selectedMove === option.move;
            return (
              <button
                key={`slot-${color}-${idx}`}
                type="button"
                className={`move-option state-${visualState} ${isSelected ? 'is-selected' : ''}`}
                disabled={!canAttemptWager || !hasSufficientBalance}
                aria-disabled={!canAttemptWager || !hasSufficientBalance}
                data-locked={betsLocked || !isGameActive || !hasSufficientBalance}
                title={!hasSufficientBalance ? 'Insufficient balance' : undefined}
                onClick={() => {
                  if (canAttemptWager && hasSufficientBalance) {
                    handleMoveBet(option.move);
                  } else {
                    if (selectedMove !== option.move) {
                      setSelectedMove(option.move);
                      handleMoveHoverEnd();
                      handleMoveHoverStart(option.move);
                    }
                  }
                }}
                onMouseEnter={() => handleMoveHoverStart(option.move)}
                onMouseLeave={handleMoveHoverEnd}
                onFocus={() => handleMoveHoverStart(option.move)}
                onBlur={handleMoveHoverEnd}
                onTouchStart={() => handleMoveHoverStart(option.move)}
                onTouchEnd={handleMoveHoverEnd}
                data-state={visualState}
              >
                <span className="move-option__left">
                  <span className="move-option__icon" aria-hidden data-color={color}>
                    <img src={pieceSrc} alt="" decoding="async" />
                  </span>
                  <span className="move-option__dest">{dest}</span>
                  <span className={`move-option__quality ${qualityClass}`} aria-label={isBest ? 'Best move' : 'Move quality percentile'}>
                    {analysis
                      ? (percentile == null
                          ? (isBest ? '💪' : '—')
                          : (isBest ? `${percentile} 💪` : `${percentile}`))
                      : '—'}
                  </span>
                </span>
                <span className="move-option__meta">{mode === 'arcade' ? `${Number(arcadeOddsByMove[canonicalSan(option.move)] || 1).toFixed(2)}x` : wageredText}</span>
              </button>
            );
          })
        ) : (
          <div className="move-panel__status">Waiting for turn</div>
        )}
      </div>
    );
  };

  const extractMoveMeta = useCallback((label: string) => {
    const isMate = label.includes('#');
    const isCheck = !isMate && label.includes('+');
    const isCapture = label.includes('x');
    const promotionMatch = label.match(/=([QRBN])/i);
    const promotionPiece = promotionMatch ? promotionMatch[1].toUpperCase() : null;
    const isCastle = /O-O/.test(label);
    return {
      isMate,
      isCheck,
      isCapture,
      isCastle,
      promotionPiece,
    };
  }, []);

  const renderNotationMove = (
    entry: NotationEntry | undefined,
    color: HoverableColor,
    index?: number,
  ) => {
    if (!entry || index == null) {
      return (
        <span
          className={[
            'notation-row__cell',
            'notation-row__cell--placeholder',
            `notation-row__cell--${color}`,
          ].join(' ')}
        >
          —
        </span>
      );
    }

    const isActive = positionIndex === index;
    const isLatest = index === latestSnapshotIndex;
    const meta = extractMoveMeta(entry.label);
    const rawLabel = sanitizeMoveLabel(entry.label);
    let displayText = rawLabel;
    if (!meta.isCastle) {
      const pieceChar = rawLabel.charAt(0);
      const symbols = PIECE_SYMBOLS[pieceChar];
      if (symbols) {
        displayText = `${symbols[color]}${rawLabel.slice(1)}`;
      }
    }

    return (
      <button
        type="button"
        className={[
          'notation-row__cell',
          `notation-row__cell--${color}`,
          meta.isCastle ? 'notation-row__cell--castle' : '',
          isActive ? 'is-active' : '',
          isLatest ? 'is-latest' : '',
        ].join(' ')}
        onClick={() => handleSelectSnapshot(index)}
        title={entry.label}
        ref={(node) => {
          if (index == null) return;
          if (node) {
            notationCellRefs.current[index] = node;
          } else {
            delete notationCellRefs.current[index];
          }
        }}
      >
        <span className="notation-row__text">{displayText}</span>
      </button>
    );
  };

  const renderNotationRow = (pair: NotationPair) => {
    const whiteIndex = pair.white?.index;
    const blackIndex = pair.black?.index;
    const rowActive = (whiteIndex != null && whiteIndex === positionIndex)
      || (blackIndex != null && blackIndex === positionIndex);
    const rowLatest = (whiteIndex != null && whiteIndex === latestSnapshotIndex)
      || (blackIndex != null && blackIndex === latestSnapshotIndex);

    return (
      <div
        key={`notation-row-${pair.moveNumber}`}
        className={[
          'notation-row',
          rowActive ? 'notation-row--active' : '',
          rowLatest ? 'notation-row--latest' : '',
        ].join(' ')}
      >
        <span className="notation-row__number">{pair.moveNumber}.</span>
        {renderNotationMove(pair.white, 'white', whiteIndex)}
        {renderNotationMove(pair.black, 'black', blackIndex)}
      </div>
    );
  };

  const renderOutcomeButton = (
    outcomeId: OutcomeId,
    label: string,
    variant: 'white' | 'black' | 'draw',
  ) => {
    const visualState = outcomeStates[outcomeId];
    const isLoading = visualState === 'loading';
    // Disable only when not live/in-progress or stake invalid or insufficient funds
    const isDisabled = (!canAttemptWager || !hasSufficientBalance) || isLoading;

    // Compute informative suffix per mode
    let suffix = '';
    if (mode === 'arcade' && game?.odds && typeof (game.odds as any)[outcomeId] === 'number') {
      const p = Math.max(1e-6, Number((game.odds as any)[outcomeId]));
      const mult = Math.max(1, (1 / p));
      const multStr = (Math.round(mult * 100) / 100).toFixed(2);
      suffix = ` ${multStr}x`;
    } else if (mode === 'real') {
      // Show current market-implied probability
      const p = outcomeId === 'white_win' ? realPrices?.white
        : outcomeId === 'black_win' ? realPrices?.black
        : realPrices?.draw;
      if (typeof p === 'number' && isFinite(p)) {
        const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
        suffix = ` ${pct}%`;
      }
    }

    return (
      <button
        type="button"
        className={`move-outcome-rail__button move-outcome-rail__button--${variant} state-${visualState}`}
        data-state={visualState}
        data-locked={betsLocked || !isGameActive}
        onClick={() => triggerOutcomeBet(outcomeId)}
        disabled={isDisabled}
      >
        <span className="move-outcome-rail__label">{label}{suffix}</span>
        <span className="move-outcome-rail__spinner" aria-hidden />
        <span className="move-outcome-rail__check" aria-hidden>✓</span>
      </button>
    );
  };

  const VISIBLE_MOBILE_SLOTS = 4;
  const mobileSlots = Array.from({ length: VISIBLE_MOBILE_SLOTS }, (_, i) => mobileMovePool[i] || null);

  const [mobileSlotMoves, setMobileSlotMoves] = useState<string[]>(Array(VISIBLE_MOBILE_SLOTS).fill(''));
  const [mobileSlotUpdating, setMobileSlotUpdating] = useState<boolean[]>(Array(VISIBLE_MOBILE_SLOTS).fill(false));
  // Mobile move interactions: tap to preview, press-and-hold to bet
  const [mobileHolding, setMobileHolding] = useState<boolean[]>(Array(VISIBLE_MOBILE_SLOTS).fill(false));
  const holdTimersRef = useRef<Array<number | null>>(Array(VISIBLE_MOBILE_SLOTS).fill(null));
  const holdStartRef = useRef<Array<{ x: number; y: number } | null>>(Array(VISIBLE_MOBILE_SLOTS).fill(null));
  const suppressNextClickRef = useRef(false);

  const HOLD_MS = 260; // snappy hold-to-bet threshold
  const MOVE_TOLERANCE = 10; // px tolerance before cancelling hold

  const selectMove = useCallback((move: string) => {
    if (selectedMove !== move) {
      handleMoveHoverEnd();
    }
    setSelectedMove(move);
    handleMoveHoverStart(move);
  }, [handleMoveHoverEnd, handleMoveHoverStart, selectedMove]);

  // Clear selection when the position index changes (new board snapshot)
  useEffect(() => {
    if (selectedMove) {
      setSelectedMove(null);
      handleMoveHoverEnd();
    }
  }, [positionIndex]);

  useEffect(() => {
    const nextMoves = mobileSlots.map((opt) => (opt ? opt.move : ''));
    // Flag a brief update animation when the move text changes for a given slot
    setMobileSlotUpdating((prev) => prev.map((_, i) => (mobileSlotMoves[i] !== '' && mobileSlotMoves[i] !== nextMoves[i])));
    setMobileSlotMoves(nextMoves);
    const t = window.setTimeout(() => {
      setMobileSlotUpdating(Array(VISIBLE_MOBILE_SLOTS).fill(false));
    }, 250);
    return () => window.clearTimeout(t);
  }, [positionIndex, mobileMovePool.length]);

  const mobileMoveOptions = mobileSlots.map((option, idx) => {
    if (!option) {
      return (
        <div key={`mobile-slot-${idx}`} className="mobile-move-chip mobile-move-chip--placeholder" aria-hidden>
          <span className="move-option__left">
            <span className="move-option__icon" aria-hidden />
            <span className="move-option__dest">—</span>
          </span>
          <span className="move-option__meta">&nbsp;</span>
        </div>
      );
    }
    const moveKey = `${positionIndex}-${option.move}`;
    const visualState = moveStates[moveKey] ?? 'idle';
    const piece = getPieceTypeFromSAN(option.move);
    const dest = getTargetSquareFromSAN(option.move) || sanitizeMoveLabel(option.move);
    const pieceSrc = `/pieces_w/${piece}.png`;
    const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      // Start hold-to-bet; also preview the move immediately
      try {
        (e.currentTarget as any).setPointerCapture?.(e.pointerId);
      } catch {}
      selectMove(option.move);
      if (!canAttemptWager || !hasSufficientBalance) {
        // Selection-only when wagering is locked; do not initiate hold timers
        return;
      }
      setMobileHolding((prev) => {
        const next = prev.slice();
        next[idx] = true;
        return next;
      });
      holdStartRef.current[idx] = { x: e.clientX, y: e.clientY };
      if (holdTimersRef.current[idx]) window.clearTimeout(holdTimersRef.current[idx]!);
      holdTimersRef.current[idx] = window.setTimeout(() => {
        suppressNextClickRef.current = true; // prevent click after long-press
        // Trigger bet (if allowed)
        if (canAttemptWager && hasSufficientBalance) handleMoveBet(option.move);
        // Stop holding visual; success/error feedback handled by existing state
        setMobileHolding((prev) => {
          const next = prev.slice();
          next[idx] = false;
          return next;
        });
        holdTimersRef.current[idx] = null;
      }, HOLD_MS);
    };
    const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      const start = holdStartRef.current[idx];
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE) {
        // Cancel hold if the finger moves too far (avoid accidental long-press)
        if (holdTimersRef.current[idx]) {
          window.clearTimeout(holdTimersRef.current[idx]!);
          holdTimersRef.current[idx] = null;
        }
        setMobileHolding((prev) => {
          if (!prev[idx]) return prev;
          const next = prev.slice();
          next[idx] = false;
          return next;
        });
      }
    };
    const cancelHold = () => {
      if (holdTimersRef.current[idx]) {
        window.clearTimeout(holdTimersRef.current[idx]!);
        holdTimersRef.current[idx] = null;
      }
      holdStartRef.current[idx] = null;
      setMobileHolding((prev) => {
        if (!prev[idx]) return prev;
        const next = prev.slice();
        next[idx] = false;
        return next;
      });
    };
    const onPointerUp = () => {
      cancelHold();
    };
    const onPointerCancel = () => {
      cancelHold();
    };
    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (suppressNextClickRef.current) {
        // Swallow the click that follows a long-press
        suppressNextClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Simple tap -> select to preview (no wager)
      selectMove(option.move);
    };
    return (
      <button
        key={`mobile-slot-${idx}`}
        type="button"
        className={`mobile-move-chip ${mobileSlotUpdating[idx] ? 'is-updating' : ''} ${mobileHolding[idx] ? 'is-holding' : ''} ${selectedMove === option.move ? 'is-selected' : ''} state-${visualState}`}
        style={{ ['--hold-ms' as any]: `${HOLD_MS}ms` }}
        disabled={!canAttemptWager || !hasSufficientBalance}
        aria-disabled={!canAttemptWager || !hasSufficientBalance}
        data-locked={betsLocked || !isGameActive || !hasSufficientBalance}
        title={!hasSufficientBalance ? 'Insufficient balance' : undefined}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        data-state={visualState}
      >
        <span className="move-option__left">
          <span className="move-option__icon" aria-hidden>
            <img src={pieceSrc} alt="" decoding="async" />
          </span>
          <span className="move-option__dest">{dest}</span>
          {(() => {
            const sanKey = toSanForCurrent(option.move);
            const analysis = (analysisByIndex[positionIndex]?.[sanKey]) || moveAnalysisBySan[analysisKey(fenKey, sanKey)];
            const isBest = !!analysis?.is_best_move;
            const rawPct = analysis?.percentile;
            const percentile = (typeof rawPct === 'number' && Number.isFinite(rawPct)) ? Math.round(rawPct) : null;
            const qualityClass = isBest
              ? 'quality-best'
              : (percentile == null)
                ? 'quality-unknown'
                : (percentile >= 70 ? 'quality-strong' : (percentile >= 40 ? 'quality-decent' : 'quality-poor'));
            return (
              <span className={`move-option__quality ${qualityClass}`} aria-label={isBest ? 'Best move' : 'Move quality percentile'}>
                {analysis
                  ? (percentile == null
                      ? (isBest ? '💪' : '—')
                      : (isBest ? `${percentile} 💪` : `${percentile}`))
                  : '—'}
              </span>
            );
          })()}
        </span>
        <span className="chip-hold-bar" aria-hidden />
        {/* Hide percent/payout meta on mobile to reduce clutter */}
      </button>
    );
  });

  const clampSize = useCallback((value: number) => {
    const raw = value;
    const snapped = ENABLE_RESIZE_SNAP
      ? Math.round(raw / BOARD_SNAP_INCREMENT) * BOARD_SNAP_INCREMENT
      : raw;
    const clamped = Math.max(MIN_BOARD_SIZE, Math.min(maxBoardSize, snapped));
    if (ENABLE_RESIZE_DEBUG && clamped !== raw) {
      console.debug('[drag clamp] raw:', raw, 'snapped:', snapped, 'clamped:', clamped, 'max:', maxBoardSize);
    }
    return clamped;
  }, [maxBoardSize]);

  const beginDrag = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startSize: boardSize,
      anchorTop: boardFrameRef.current?.getBoundingClientRect().top ?? null,
    };
    if (ENABLE_RESIZE_DEBUG) {
      console.debug('[drag start] size:', boardSize, 'x:', clientX, 'y:', clientY);
    }
    setIsDragging(true);
  }, [boardSize]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const clientX = (event instanceof TouchEvent)
        ? event.touches[0]?.clientX ?? dragStateRef.current.startX
        : event.clientX;
      const clientY = (event instanceof TouchEvent)
        ? event.touches[0]?.clientY ?? dragStateRef.current.startY
        : event.clientY;
      const deltaX = clientX - dragStateRef.current.startX;
      const deltaY = clientY - dragStateRef.current.startY;
      const dominantDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      const nextSize = clampSize(dragStateRef.current.startSize + dominantDelta);
      if (ENABLE_RESIZE_DEBUG) {
        console.debug('[drag move] deltaX:', deltaX, 'deltaY:', deltaY, 'dominant:', dominantDelta, 'next:', nextSize);
      }
      setBoardSize(nextSize);
      // Update ratio so subsequent window resize keeps the same relative size.
      const ratio = Math.max(0, Math.min(1, nextSize / (maxBoardSize || nextSize)));
      setSizeRatio(ratio);
    };
    const handleEnd = () => {
      setIsDragging(false);
      dragStateRef.current.anchorTop = null;
    };
    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [clampSize, isDragging]);

  useLayoutEffect(() => {
    if (!isDragging) return;
    const anchorTop = dragStateRef.current.anchorTop;
    if (anchorTop == null) return;
    const frameTop = boardFrameRef.current?.getBoundingClientRect().top ?? null;
    if (frameTop == null) return;
    const delta = frameTop - anchorTop;
    if (delta !== 0) {
      window.scrollBy({ top: delta });
      dragStateRef.current.anchorTop = boardFrameRef.current?.getBoundingClientRect().top ?? anchorTop;
    }
  }, [boardSize, isDragging]);

  const notationPairs = useMemo<NotationPair[]>(() => {
    const pairs: NotationPair[] = [];
    let moveNumber = 1;
    for (let index = 1; index < snapshots.length; index += 2, moveNumber += 1) {
      const whiteSnapshot = snapshots[index];
      const blackSnapshot = snapshots[index + 1];
      pairs.push({
        moveNumber,
        white: whiteSnapshot ? {
          index,
          label: whiteSnapshot.label,
          eval: whiteSnapshot.eval,
        } : undefined,
        black: blackSnapshot ? {
          index: index + 1,
          label: blackSnapshot.label,
          eval: blackSnapshot.eval,
        } : undefined,
      });
    }
    return pairs;
  }, [snapshots]);


  const handleStep = useCallback((direction: 1 | -1) => {
    setPositionIndex((prev) => {
      const next = Math.min(latestSnapshotIndex, Math.max(0, prev + direction));
      setIsFollowingLive(next === latestSnapshotIndex);
      return next;
    });
  }, [latestSnapshotIndex]);

  const handleSelectSnapshot = useCallback((index: number) => {
    const nextIndex = Math.min(latestSnapshotIndex, Math.max(0, index));
    setIsFollowingLive(nextIndex === latestSnapshotIndex);
    setPositionIndex(nextIndex);
  }, [latestSnapshotIndex]);

  const handleJumpToLive = useCallback(() => {
    setIsFollowingLive(true);
    setPositionIndex(latestSnapshotIndex);
  }, [latestSnapshotIndex]);

  const handleJumpToStart = useCallback(() => {
    setIsFollowingLive(false);
    setPositionIndex(0);
  }, []);

  useEffect(() => {
    if (isNotationHovered) return;
    const target = notationCellRefs.current[positionIndex];
    const container = notationListRef.current;
    if (target && container) {
      const targetOffset = target.offsetTop;
      const targetHeight = target.offsetHeight;
      const containerHeight = container.clientHeight;
      const scrollTop = targetOffset - (containerHeight / 2) + (targetHeight / 2);
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });
    }
  }, [isNotationHovered, positionIndex]);

  // Removed live status chip from UI

  // Loading + unauthenticated states from legacy implementation
  if (!game) {
    return (
      <div className="loading-container">
        <div className="loading-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="dark-game-page">
        <NavBar compact={true} />
        <div className="unauthenticated-container">
          <div className="unauthenticated-content">
            <h2>Welcome to Betmate</h2>
            <p>Sign in to place bets on this chess match!</p>
            <div className="preview-board">
              <ChessgroundWrapper
                config={useMemo(() => ({
                  fen: game?.state || DEFAULT_FEN,
                  viewOnly: true,
                  coordinates: true,
                  turnColor: game?.state?.includes(' w ') ? 'white' as const : 'black' as const,
                  lastMove: game?.move_hist?.length > 0
                    ? [game.move_hist[game.move_hist.length - 1].from as Key, game.move_hist[game.move_hist.length - 1].to as Key]
                    : undefined,
                  movable: {
                    free: false,
                    color: 'both',
                    rookCastle: true,
                  },
                  highlight: { lastMove: true, check: true },
                  animation: { duration: 200 },
                  drawable: {
                    enabled: false,
                    visible: false,
                    defaultSnapToValidMove: true,
                    eraseOnClick: false,
                  },
                }), [game?.state, game?.move_hist])}
              />
            </div>
            <div className="auth-buttons">
              <a href="/signin" className="auth-button signin">Sign In</a>
              <a href="/signup" className="auth-button signup">Sign Up</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {game.game_status === GameStatus.NOT_STARTED && showModal[gameId] && <PregameModal />}
      {/* Deprecated postgame drawer removed per requirements */}

      <OnboardingGate isAuthenticated={isAuthenticated} />

      <div className="dark-game-page">
        <ConnectionStatus />
        <NavBar compact={true} />
        <div className="chess-match-page">
          <div className="chess-match-page__content">
            <div className="board-demo">
              <div className="board-layout" style={{ ['--board-width' as any]: `${boardFrameWidth}px` }}>
                <div
                  className={[
                    'move-outcome-rail-column',
                  ].join(' ')}
                  data-locked={false}
                >
                  <>
                    <div className="move-outcome-rail-column__item move-outcome-rail-column__item--actions-only">
                      <div className="move-outcome-rail-column__actions">
                        {renderOutcomeButton('black_win', `Bet ${game.player_black?.name?.split(' ')[0] || 'Black'}`, 'black')}
                      </div>
                    </div>
                    <div className={`move-outcome-rail-column__center ${isWhiteTurn ? 'is-white-turn' : 'is-black-turn'}`}>
                      {renderMovePanel('white', 'move-panel--center', isWhiteTurn, whiteMovePool)}
                      {renderMovePanel('black', 'move-panel--center', isBlackTurn, blackMovePool)}
                    </div>
                    <div className="move-outcome-rail-column__item move-outcome-rail-column__item--actions-only">
                      <div className="move-outcome-rail-column__actions">
                        {renderOutcomeButton('white_win', `Bet ${game.player_white?.name?.split(' ')[0] || 'White'}`, 'white')}
                      </div>
                    </div>
                  </>
                </div>
                <div className="board-layout__main">
                  <div
                    ref={boardFrameRef}
                    className={`board-frame ${!isAtLatestSnapshot ? 'board-frame--rewound' : ''}`}
                    style={{ width: boardFrameWidth }}
                  >
                    <div
                      className={`player-header state-${outcomeStates['black_win']} ${isTurnHighlightEnabled && isBlackTurn ? 'is-active-turn' : ''}`}
                      role={isMobile ? 'button' as const : undefined}
                      tabIndex={isMobile ? 0 : undefined}
                      onClick={isMobile ? () => triggerOutcomeBet('black_win') : undefined}
                      onKeyDown={isMobile ? (e) => { if (e.key === 'Enter' || e.key === ' ') triggerOutcomeBet('black_win'); } : undefined}
                      aria-label={isMobile ? 'Tap to bet Black' : undefined}
                      aria-busy={outcomeStates['black_win'] === 'loading'}
                      style={isMobile ? { width: boardStackWidth } : undefined}
                    >
                      <div className="player-meta">
                        <span className="player-name">{game.player_black?.name}</span>
                        <span className="player-rating">{game.player_black?.elo}</span>
                      </div>
                      <div className="player-clock-group">
                        <span className="player-clock">{blackClock}</span>
                        {isMobile && (
                          <span className="player-bet-hint">Tap</span>
                        )}
                      </div>
                      <span className="ph-spinner" aria-hidden />
                      <span className="ph-check" aria-hidden>✓</span>
                    </div>
                    <div className="board-eval-stack" style={{ width: boardStackWidth, gap: BOARD_STACK_GAP }}>
                      <div className="board-shell" style={{ width: boardSize, height: boardSize }}>
                        <div className="chessboard-wrapper brown" style={{ width: '100%', height: '100%' }} ref={groundWrapperRef}>
                          <ChessgroundWrapper config={boardConfig} />
                          {gameOver(game.game_status as GameStatus) && (
                            <GameEndOverlay
                              gameStatus={game.game_status as GameStatus}
                              resolvedWagers={resolvedWagers}
                              gameId={gameId}
                            />
                          )}
                        </div>
                      </div>
                      <div className="eval-bar-container" style={{ height: boardSize, width: evalBarWidth }}>
                        <EvaluationBar
                          odds={oddsByIndex[positionIndex] || (isAtLatestSnapshot ? game?.odds : approximateOddsFromFen(activeSnapshot?.fen))}
                          width={evalBarWidth}
                        />
                      </div>
                    </div>
                    <div
                      className={`player-header state-${outcomeStates['white_win']} ${isTurnHighlightEnabled && isWhiteTurn ? 'is-active-turn' : ''}`}
                      role={isMobile ? 'button' as const : undefined}
                      tabIndex={isMobile ? 0 : undefined}
                      onClick={isMobile ? () => triggerOutcomeBet('white_win') : undefined}
                      onKeyDown={isMobile ? (e) => { if (e.key === 'Enter' || e.key === ' ') triggerOutcomeBet('white_win'); } : undefined}
                      aria-label={isMobile ? 'Tap to bet White' : undefined}
                      aria-busy={outcomeStates['white_win'] === 'loading'}
                      style={isMobile ? { width: boardStackWidth } : undefined}
                    >
                      <div className="player-meta">
                        <span className="player-name">{game.player_white?.name}</span>
                        <span className="player-rating">{game.player_white?.elo}</span>
                      </div>
                      <div className="player-clock-group">
                        <span className="player-clock">{whiteClock}</span>
                        {isMobile && (
                          <span className="player-bet-hint">Tap</span>
                        )}
                      </div>
                      <span className="ph-spinner" aria-hidden />
                      <span className="ph-check" aria-hidden>✓</span>
                    </div>
                    {isDesktop && (
                      <button
                        type="button"
                        className={`board-resize-handle ${isDragging ? 'dragging' : ''}`}
                        onMouseDown={beginDrag}
                        onTouchStart={beginDrag}
                        aria-label="Resize board"
                      />
                    )}
                  </div>
                  {/* On mobile, show move market right below the board */}
                  <div
                    className={`mobile-move-market ${isWhiteTurn ? 'is-white-turn' : 'is-black-turn'}`}
                    style={isMobile ? { width: boardFrameWidth, margin: '0 auto' } : undefined}
                  >
                    <div className="mobile-move-bubbles">
                      {mobileMoveOptions}
                    </div>
                  </div>
                  <div
                    className="notation-column"
                    style={isMobile ? { width: boardFrameWidth, margin: '0 auto' } : undefined}
                  >
                  <aside className="notation-rail">
                    <div className="notation-nav">
                      <button
                        type="button"
                        onClick={handleJumpToStart}
                        disabled={positionIndex === 0}
                        aria-label="Jump to start"
                      >
                        |◀
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStep(-1)}
                        disabled={positionIndex === 0}
                        aria-label="Previous move"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStep(1)}
                        disabled={positionIndex === latestSnapshotIndex}
                        aria-label="Next move"
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        onClick={handleJumpToLive}
                        disabled={isAtLatestSnapshot}
                        aria-label="Jump to latest move"
                      >
                        ▶|
                      </button>
                    </div>
                    <div
                      className="notation-rail__list"
                      ref={notationListRef}
                      onMouseEnter={() => setIsNotationHovered(true)}
                      onMouseLeave={() => setIsNotationHovered(false)}
                    >
                      {notationPairs.length ? notationPairs.map((pair) => renderNotationRow(pair)) : (
                        <div className="notation-row notation-row--empty">
                          <span className="notation-row__number">—</span>
                          <span className="notation-row__cell notation-row__cell--placeholder">
                            Moves will appear here
                          </span>
                          <span className="notation-row__cell notation-row__cell--placeholder" />
                        </div>
                      )}
                    </div>
                  </aside>
                  <section className="wager-receipts" aria-label="Wager receipts">
                    <div className="wager-receipts__list">
                      {displayReceipts && displayReceipts.length ? displayReceipts.slice(0, 10).map((w) => {
                        const isReal = (w as any).mode === 'real';
                        const typeIcon = w.wdl ? '🏁' : '🎯';
                        const statusInfo = (() => {
                          switch (w.status) {
                            case WagerStatus.WON: return { icon: '✅', label: 'Won' };
                            case WagerStatus.LOST: return { icon: '❌', label: 'Lost' };
                            case WagerStatus.CANCELLED: return { icon: '↩️', label: 'Refund' };
                            default: return { icon: '⏳', label: 'Pending' };
                          }
                        })();
                        const label = (() => {
                          if (w.wdl) {
                            const d = (w.data || '').toLowerCase();
                            if (d.includes('white')) return 'White Win';
                            if (d.includes('black')) return 'Black Win';
                            if (d.includes('draw')) return 'Draw';
                            if (d === 'win') return 'Win';
                            if (d === 'loss') return 'Loss';
                            return String(w.data || 'Outcome');
                          }
                          return sanitizeMoveLabel(String(w.data || ''));
                        })();
                        // Compute net
                        const net = (() => {
                          if (w.status === WagerStatus.WON) {
                            if (w.wdl) {
                              const mult = isReal ? (w.winning_pool_share || 0) : (w.odds || 1);
                              return (w.amount * mult) - w.amount;
                            }
                            return (w.amount * (w.winning_pool_share || 0)) - w.amount;
                          }
                          if (w.status === WagerStatus.LOST) return -w.amount;
                          if (w.status === WagerStatus.CANCELLED) return 0;
                          return null;
                        })();
                        // Only show multiplier for Real WDL winners; hide otherwise to reduce clutter
                        const realWinnerMult = (isReal && w.wdl && w.status === WagerStatus.WON && Number.isFinite(w.winning_pool_share) && (w.winning_pool_share || 0) > 0)
                          ? `x${getMultiplier(w.winning_pool_share)}`
                          : '';
                        return (
                          <div
                            key={w._id}
                            className={[
                              'wager-receipt',
                              w.status === WagerStatus.WON ? 'wager-receipt--won' : '',
                              w.status === WagerStatus.LOST ? 'wager-receipt--lost' : '',
                              w.status === WagerStatus.CANCELLED ? 'wager-receipt--cancelled' : '',
                            ].join(' ')}
                            title={String(w.data)}
                          >
                            <div className="wager-receipt__title">
                              <span className={`wr-type ${w.wdl ? 'wr-type--outcome' : 'wr-type--move'}`} aria-hidden>{typeIcon}</span>{' '}
                              <span>{label}</span>
                            </div>
                            <div className="wager-receipt__meta">
                              <span className="wr-pill wr-pill--stake">${w.amount}</span>{' '}
                              {realWinnerMult && (
                                <span className="wr-odds" title="Payout multiplier">{realWinnerMult}</span>
                              )}{' '}
                              <span className={`wr-status wr-status--${w.status}`} title={statusInfo.label}>
                                {statusInfo.icon} {statusInfo.label}
                              </span>{' '}
                              {net !== null && (
                                <span className={`wr-net ${net >= 0 ? 'wr-net--pos' : 'wr-net--neg'}`}>
                                  {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="wager-receipt wager-receipt--empty">No wager receipts yet</div>
                      )}
                    </div>
                  </section>
                  </div>
                </div>
              </div>
            </div>
            {/* Replaced legacy second row with a thin bottom toolbar */}
          </div>
        </div>
      </div>
      {/* Bottom Toolbar (fixed) */}
      <BottomToolbar
        selectedStake={selectedStake}
        onSelectStake={setSelectedStake}
        stakePresets={STAKE_PRESETS}
        viewerCount={viewerCount}
        onOpenChat={openChat}
        onOpenLeaderboard={openLeaderboard}
        isLive={isEffectivelyLive && isGameInProgress}
        onDraw={() => triggerOutcomeBet('draw')}
        drawState={outcomeStates['draw']}
        canDraw={canAttemptWager && hasSufficientBalance}
        pricingVersion={pricingVersion}
        isRealMode={mode === 'real'}
        drawPct={typeof realPrices?.draw === 'number' ? realPrices!.draw * 100 : undefined as any}
      />

      {/* Fullscreen overlays */}
      {activeOverlay && (
        <div
          className="cm-overlay-backdrop"
          onClick={closeOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={activeOverlay === 'chat' ? 'Chat' : 'Leaderboard'}
        >
          <div className="cm-overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cm-overlay-header">
              <div className="cm-overlay-title">
                {activeOverlay === 'chat' ? 'Chat' : 'Leaderboard'}
              </div>
              <button type="button" className="cm-overlay-close" onClick={closeOverlay} aria-label="Close">
                ×
              </button>
            </div>
            <div className="cm-overlay-body">
              {activeOverlay === 'chat' ? (
                <ChatBox />
              ) : (
                <MiniLeaderboard rankings={rankings || []} showTitle={false} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ChessMatch);
