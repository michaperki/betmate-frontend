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
import ChessgroundWrapper from 'components/ChessgroundWrapper';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import { Key, MoveMetadata } from 'chessground/types';
import { Chess, Square } from 'chess.js';
import NavBar from 'components/NavBar';
import MiniLeaderboard from 'components/BettingSidebar/MiniLeaderboard';
import ChatBox from 'components/ChatBox';
import ConnectionStatus from 'components/ConnectionStatus';
import OnboardingGate from 'components/OnboardingGate';
import PregameModal from 'components/PregameModal';
import PostgameModal from 'components/PostgameModal';
import GameEndOverlay from 'components/GameEndOverlay';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import {
  fetchGameById,
  fetchGameStats,
  setPendingBet,
  clearPendingBet,
  toggleQuickBet,
} from 'store/actionCreators/gameActionCreators';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { gameInProgress, gameOver, getValidMoves } from 'utils/chess';
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

const ChessMatch: React.FC<ChessMatchProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const groundWrapperRef = useRef<HTMLDivElement>(null);
  const boardFrameRef = useRef<HTMLDivElement | null>(null);
  const outcomeResetTimers = useRef<Record<OutcomeId, number | null>>({
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
  const [positionIndex, setPositionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverArrow, setHoverArrow] = useState<[string, string] | null>(null);
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

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGameById(gameId);
      fetchGameStats(gameId);
      getGameLeaderboard(gameId);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchGameById, fetchGameStats, getGameLeaderboard, gameId]);

  const isGameInProgress = useMemo(() => (
    game ? gameInProgress(game.game_status as GameStatus) : false
  ), [game?.game_status]);

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
      setBoardSize((prev) => {
        const unclamped = prev;
        const snapped = ENABLE_RESIZE_SNAP
          ? Math.round(unclamped / BOARD_SNAP_INCREMENT) * BOARD_SNAP_INCREMENT
          : unclamped;
        const clamped = Math.min(nextMax, Math.max(MIN_BOARD_SIZE, snapped));
        if (ENABLE_RESIZE_DEBUG && clamped !== prev) {
          console.debug('[resize handler] max:', nextMax, 'prev:', prev, 'snapped:', snapped, 'clamped:', clamped);
        }
        return clamped;
      });
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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
  const betsLocked = !isAtLatestSnapshot;
  const canPlaceWagers = !betsLocked && isAuthenticated && !!selectedStake && isGameInProgress;

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

  const evalScore = activeSnapshot?.eval ?? 0;
  const evalPercent = Math.max(0, Math.min(100, ((evalScore + 1) / 2) * 100));

  // Initialize display clocks when game or turn updates
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

    const now = Date.now();
    const updatedAtMs = game?.updated_at ? new Date(game.updated_at).getTime() : now;
    const elapsed = Math.max(0, Math.floor((now - updatedAtMs) / 1000));

    const shouldTick = isAtLatestSnapshot && isGameInProgress;
    const whiteStart = shouldTick && activeSnapshot?.turn === 'w' ? Math.max(0, whiteBaseSecs - elapsed) : whiteBaseSecs;
    const blackStart = shouldTick && activeSnapshot?.turn === 'b' ? Math.max(0, blackBaseSecs - elapsed) : blackBaseSecs;

    setDisplayWhiteSecs(whiteStart);
    setDisplayBlackSecs(blackStart);
  }, [game?.time_white, game?.time_black, game?.updated_at, game?.time_format, activeSnapshot?.turn, isAtLatestSnapshot, isGameInProgress]);

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
  const FRAME_HORIZONTAL_PADDING = 12;
  const boardStackWidth = boardSize + evalBarWidth + BOARD_STACK_GAP;
  const boardFrameWidth = boardStackWidth + FRAME_HORIZONTAL_PADDING;

  const deriveMoveOptions = useMemo<MoveOption[]>(() => {
    const options = game?.pool_wagers?.move?.options ?? [];
    const wagers = game?.pool_wagers?.move?.wagers ?? [];
    if (!options.length) return [];
    const totals: Record<string, number> = {};
    wagers.forEach((entry) => {
      if (!entry?.data) return;
      totals[entry.data] = (totals[entry.data] ?? 0) + (entry.amount ?? 0);
    });
    const poolTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const fallbackPercent = options.length ? 100 / options.length : 0;
    return options.map((move) => {
      const wagerTotal = totals[move] ?? 0;
      const percent = poolTotal ? (wagerTotal / poolTotal) * 100 : fallbackPercent;
      const payout = wagerTotal ? Math.max(1, poolTotal / wagerTotal) : options.length;
      return { move, percent, payout, wagered: wagerTotal };
    });
  }, [game?.pool_wagers?.move]);

  const whiteMovePool = isWhiteTurn ? deriveMoveOptions : [];
  const blackMovePool = isBlackTurn ? deriveMoveOptions : [];
  const mobileMovePool = deriveMoveOptions;
  const mobileMoveOwner = isWhiteTurn ? game?.player_white : game?.player_black;

  const handleDragMove = useCallback((orig: Key, dest: Key, _metadata?: MoveMetadata) => {
    if (!game || betsLocked) return;
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

      if (quickBetMode && canPlaceWagers) {
        const wagerPromise = createWager(
          gameId,
          move.san,
          selectedStake,
          false,
          1,
          game.move_hist.length + 1,
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
      console.error('Invalid move', error);
    }
  }, [betsLocked, canPlaceWagers, clearPendingBet, createWager, game, gameId, onEnterMovePanel, onMoveHover, onMoveUnhover, quickBetMode, selectedStake, setPendingBet]);

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
    return matches && matches.length ? matches[matches.length - 1] : null;
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
  const fetchedHistory = useSelector((state: RootState) => state.wager?.wagerHistory ?? []);
  const receipts = useMemo<Wager[]>(() => {
    const local = Object.values(allWagersMap) as Wager[];
    const merged = [...local, ...fetchedHistory];
    const seen: Record<string, boolean> = {};
    const filtered = merged.filter((w) => {
      if (!w || seen[w._id]) return false;
      seen[w._id] = true;
      return w.game_id === gameId;
    });
    filtered.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return filtered.slice(0, 10);
  }, [allWagersMap, fetchedHistory, gameId]);

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
    const time = w.created_at ? new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return `${amount} • ${time}`;
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

  const triggerOutcomeBet = useCallback(async (outcomeId: OutcomeId) => {
    if (!canPlaceWagers || !game) return;
    let started = false;
    setOutcomeStates((prev) => {
      if (prev[outcomeId] === 'loading') return prev;
      started = true;
      return { ...prev, [outcomeId]: 'loading' };
    });
    if (!started) return;

    try {
      const wagerPromise = createWager(
        gameId,
        outcomeId,
        selectedStake,
        true,
        game.odds?.[outcomeId] ? 1 / game.odds[outcomeId] : 1,
        game.move_hist.length + 1,
      );
      await Promise.resolve(wagerPromise);
      updateOutcomeState(outcomeId, 'success');
      scheduleOutcomeReset(outcomeId, 600);
      // Refresh receipts so new wagers appear promptly
      dispatch(fetchWagerHistory(undefined, 10, 0));
    } catch (error) {
      console.error('Outcome bet failed', error);
      updateOutcomeState(outcomeId, 'error');
      scheduleOutcomeReset(outcomeId, 800);
    }
  }, [canPlaceWagers, createWager, game, gameId, scheduleOutcomeReset, selectedStake, updateOutcomeState]);

  const handleMoveBet = useCallback(async (move: string) => {
    if (!canPlaceWagers || !game) return;
    const moveKey = `${positionIndex}-${move}`;
    if (moveStates[moveKey] === 'loading') return;
    updateMoveState(moveKey, 'loading');
    try {
      const wagerPromise = createWager(
        gameId,
        move,
        selectedStake,
        false,
        1,
        game.move_hist.length + 1,
      );
      await Promise.resolve(wagerPromise);
      updateMoveState(moveKey, 'success');
      scheduleMoveReset(moveKey, 500);
      // Refresh receipts so new wagers appear promptly
      dispatch(fetchWagerHistory(undefined, 10, 0));
    } catch (error) {
      console.error('Move bet failed', error);
      updateMoveState(moveKey, 'error');
      scheduleMoveReset(moveKey, 700);
    }
  }, [canPlaceWagers, createWager, game, gameId, moveStates, positionIndex, scheduleMoveReset, selectedStake, updateMoveState]);

  useEffect(() => () => {
    (Object.keys(outcomeResetTimers.current) as OutcomeId[]).forEach((outcomeId) => {
      const timer = outcomeResetTimers.current[outcomeId];
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
      const pieceSrc = color === 'white' ? `/pieces_w/${piece}.png` : `/pieces/${piece}.png`;
      return (
        <button
          key={`${color}-${option.move}`}
          type="button"
          className={`move-option state-${visualState}`}
          onClick={() => handleMoveBet(option.move)}
          onMouseEnter={() => handleMoveHoverStart(option.move)}
          onMouseLeave={handleMoveHoverEnd}
          onFocus={() => handleMoveHoverStart(option.move)}
          onBlur={handleMoveHoverEnd}
          onTouchStart={() => handleMoveHoverStart(option.move)}
          onTouchEnd={handleMoveHoverEnd}
          data-state={visualState}
          disabled={!canPlaceWagers}
        >
          <span className="move-option__left">
            <span className="move-option__icon" aria-hidden data-color={color}>
              <img src={pieceSrc} alt="" />
            </span>
            <span className="move-option__dest">{dest}</span>
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
  ) => (
    <div
      className={[
        'move-panel',
        alignmentClass,
        isActive ? 'move-panel--expanded' : 'move-panel--collapsed',
        !canPlaceWagers ? 'move-panel--locked' : '',
      ].join(' ')}
      data-locked={!canPlaceWagers}
      aria-live={isActive ? 'polite' : 'off'}
    >
      {isActive ? renderMoveOptions(options, color) : (
        <div className="move-panel__status">
          {betsLocked ? 'Historical snapshot' : 'Loading'}
        </div>
      )}
    </div>
  );

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
    const isDisabled = !canPlaceWagers;

    return (
      <button
        type="button"
        className={`outcome-rail__button outcome-rail__button--${variant} state-${visualState}`}
        data-state={visualState}
        data-locked={!canPlaceWagers}
        onClick={() => triggerOutcomeBet(outcomeId)}
        disabled={isDisabled || isLoading}
      >
        <span className="outcome-rail__label">{label}</span>
        <span className="outcome-rail__spinner" aria-hidden />
        <span className="outcome-rail__check" aria-hidden>✓</span>
      </button>
    );
  };

  const mobileMoveOptions = mobileMovePool.length ? (
    mobileMovePool.map((option) => {
      const moveKey = `${positionIndex}-${option.move}`;
      const visualState = moveStates[moveKey] ?? 'idle';
      return (
        <button
          key={`mobile-${option.move}`}
          type="button"
          className={`mobile-move-chip state-${visualState}`}
          onClick={() => handleMoveBet(option.move)}
          onMouseEnter={() => handleMoveHoverStart(option.move)}
          onMouseLeave={handleMoveHoverEnd}
          onFocus={() => handleMoveHoverStart(option.move)}
          onBlur={handleMoveHoverEnd}
          onTouchStart={() => handleMoveHoverStart(option.move)}
          onTouchEnd={handleMoveHoverEnd}
          data-state={visualState}
          disabled={!canPlaceWagers}
        >
          <span className="mobile-move-chip__label">{sanitizeMoveLabel(option.move)}</span>
          <span className="mobile-move-chip__meta">
            {option.percent.toFixed(0)}% · {option.payout.toFixed(1)}x
          </span>
        </button>
      );
    })
  ) : (
    <div className="mobile-move-chip mobile-move-chip--empty">
      Waiting on {isWhiteTurn ? 'Black' : 'White'} to move
    </div>
  );

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

  const whiteShareRaw = Math.max(8, evalPercent);
  const blackShareRaw = Math.max(8, 100 - evalPercent);
  const blueShareRaw = Math.max(8, 100 - whiteShareRaw - blackShareRaw);
  const totalShare = whiteShareRaw + blackShareRaw + blueShareRaw;
  const whiteShare = (whiteShareRaw / totalShare) * 100;
  const blackShare = (blackShareRaw / totalShare) * 100;
  const blueShare = 100 - whiteShare - blackShare;

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
      {gameOver(game.game_status as GameStatus) && <PostgameModal />}

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
                    'outcome-rail-column',
                    betsLocked ? 'is-locked' : '',
                  ].join(' ')}
                  data-locked={betsLocked}
                >
                  <>
                    <div className="outcome-rail-column__item outcome-rail-column__item--actions-only">
                      <div className="outcome-rail-column__actions">
                        {renderOutcomeButton('black_win', `Bet ${game.player_black?.name?.split(' ')[0] || 'Black'}`, 'black')}
                      </div>
                      <div className="outcome-rail-column__subactions">
                        {renderOutcomeButton('draw', 'Draw', 'draw')}
                      </div>
                    </div>
                    <div className={`outcome-rail-column__center ${isWhiteTurn ? 'is-white-turn' : 'is-black-turn'}`}>
                      {renderMovePanel('white', 'move-panel--center', isWhiteTurn, whiteMovePool)}
                      {renderMovePanel('black', 'move-panel--center', isBlackTurn, blackMovePool)}
                    </div>
                    <div className="outcome-rail-column__item outcome-rail-column__item--actions-only">
                      <div className="outcome-rail-column__actions">
                        {renderOutcomeButton('white_win', `Bet ${game.player_white?.name?.split(' ')[0] || 'White'}`, 'white')}
                      </div>
                      <div className="outcome-rail-column__subactions">
                        {renderOutcomeButton('draw', 'Draw', 'draw')}
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
                    <div className="player-header">
                      <div className="player-meta">
                        <span className="player-name">{game.player_black?.name}</span>
                        <span className="player-rating">{game.player_black?.elo}</span>
                      </div>
                      <div className="player-clock-group">
                        <span className="player-clock">{blackClock}</span>
                      </div>
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
                      <div className="eval-bar-demo" style={{ height: boardSize, width: evalBarWidth }}>
                        <div
                          className="eval-bar-segment eval-bar-segment--black"
                          style={{ height: `${blackShare}%`, top: 0 }}
                        />
                        <div
                          className="eval-bar-segment eval-bar-segment--blue"
                          style={{ height: `${blueShare}%`, top: `${blackShare}%` }}
                        />
                        <div
                          className="eval-bar-segment eval-bar-segment--white"
                          style={{ height: `${whiteShare}%`, bottom: 0 }}
                        />
                        {evalScore >= 0 ? (
                          <div className="eval-bar-demo__value eval-bar-demo__value--white">
                            +{evalScore.toFixed(1)}
                          </div>
                        ) : (
                          <div className="eval-bar-demo__value eval-bar-demo__value--black">
                            {evalScore.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="player-header">
                      <div className="player-meta">
                        <span className="player-name">{game.player_white?.name}</span>
                        <span className="player-rating">{game.player_white?.elo}</span>
                      </div>
                      <div className="player-clock-group">
                        <span className="player-clock">{whiteClock}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`board-resize-handle ${isDragging ? 'dragging' : ''}`}
                      onMouseDown={beginDrag}
                      onTouchStart={beginDrag}
                      aria-label="Resize board"
                    />
                  </div>
                  <div className="notation-column">
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
                      {receipts && receipts.length ? receipts.slice(0, 10).map((w) => (
                        <div
                          key={w._id}
                          className={[
                            'wager-receipt',
                            w.status === WagerStatus.WON ? 'wager-receipt--won' : '',
                            w.status === WagerStatus.LOST ? 'wager-receipt--lost' : '',
                            w.status === WagerStatus.CANCELLED ? 'wager-receipt--cancelled' : '',
                          ].join(' ')}
                          title={w.data}
                        >
                          <div className="wager-receipt__title">{formatReceiptLabel(w)}</div>
                          <div className="wager-receipt__meta">{formatReceiptMeta(w)}</div>
                        </div>
                      )) : (
                        <div className="wager-receipt wager-receipt--empty">No wager receipts yet</div>
                      )}
                    </div>
                  </section>
                  </div>
                </div>
              </div>
            </div>
            {/* Replaced legacy second row with a thin bottom toolbar */}
            <div className="mobile-move-market">
              <div className="mobile-move-market__header">
                <div>
                  <span className="mobile-move-market__label">
                    {isWhiteTurn ? 'White to move' : 'Black to move'}
                  </span>
                  <span className="mobile-move-market__sub">
                    {mobileMoveOwner?.name} • {mobileMoveOwner?.elo}
                  </span>
                </div>
                <span className="mobile-move-market__hint">
                  {mobileMovePool.length ? `${mobileMovePool.length} candidate moves` : 'Waiting on opponent'}
                </span>
              </div>
              <div className="mobile-move-bubbles">
                {mobileMoveOptions}
              </div>
              <div className="mobile-outcome-row">
                {renderOutcomeButton('black_win', `Bet ${game.player_black?.name?.split(' ')[0] || 'Black'}`, 'black')}
                {renderOutcomeButton('draw', 'Hold for Draw', 'draw')}
                {renderOutcomeButton('white_win', `Bet ${game.player_white?.name?.split(' ')[0] || 'White'}`, 'white')}
              </div>
            </div>
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
        isLive={isAtLatestSnapshot}
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
                <MiniLeaderboard rankings={rankings || []} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ChessMatch);
