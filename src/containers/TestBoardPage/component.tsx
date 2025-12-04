import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Chess } from 'chess.js';
import { Key } from 'chessground/types';
import ChessgroundWrapper from 'components/ChessgroundWrapper';
import { Config } from 'chessground/config';
import NavBar from 'components/NavBar';
import './style.scss';

const DEMO_MOVES = [
  { move: 'e4', label: '1. e4', eval: 0.3 },
  { move: 'e5', label: '... e5', eval: 0.15 },
  { move: 'd4', label: '2. d4', eval: 0.4 },
  { move: 'd6', label: '... d6', eval: 0.1 },
];

interface Snapshot {
  fen: string;
  label: string;
  eval: number;
  lastMove?: [Key, Key];
  turn: 'w' | 'b';
}

const PLAYER_WHITE = {
  name: 'Luna Hart',
  rating: 2375,
};

const PLAYER_BLACK = {
  name: 'Orion Vega',
  rating: 2410,
};

const formatClock = (seconds: number) => {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const MIN_BOARD_SIZE = 350;

interface MoveOption {
  move: string;
  percent: number;
  payout: number;
}

interface MoveSet {
  whiteMoves: MoveOption[];
  blackMoves: MoveOption[];
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

type OutcomeId = 'black_win' | 'draw' | 'white_win';
type OutcomeVisualState = 'idle' | 'loading' | 'success' | 'error';
type OutcomeDevMode = 'success' | 'error';

type MoveVisualState = 'idle' | 'loading' | 'success' | 'error';
type MoveDevMode = 'success' | 'error';

const OUTCOME_LABELS: Record<OutcomeId, string> = {
  black_win: 'Black',
  draw: 'Draw',
  white_win: 'White',
};
const OUTCOME_SEQUENCE: OutcomeId[] = ['black_win', 'draw', 'white_win'];
const MOVE_SETS: MoveSet[] = [
  {
    whiteMoves: [
      { move: 'e4', percent: 41, payout: 1.9 },
      { move: 'd4', percent: 33, payout: 2.4 },
      { move: 'Nf3', percent: 26, payout: 2.9 },
    ],
    blackMoves: [],
  },
  {
    whiteMoves: [],
    blackMoves: [
      { move: '... c5', percent: 39, payout: 2.2 },
      { move: '... e5', percent: 36, payout: 2.5 },
      { move: '... d6', percent: 18, payout: 4.1 },
    ],
  },
  {
    whiteMoves: [
      { move: 'Bc4', percent: 31, payout: 2.8 },
      { move: 'Bb5', percent: 28, payout: 3.0 },
      { move: 'd4', percent: 23, payout: 3.2 },
    ],
    blackMoves: [],
  },
  {
    whiteMoves: [],
    blackMoves: [
      { move: '... exd4', percent: 45, payout: 1.8 },
      { move: '... Nf6', percent: 27, payout: 3.3 },
      { move: '... c5', percent: 16, payout: 5.0 },
    ],
  },
  {
    whiteMoves: [
      { move: 'Nc3', percent: 35, payout: 2.6 },
      { move: 'c4', percent: 29, payout: 3.3 },
      { move: 'f4', percent: 18, payout: 4.4 },
    ],
    blackMoves: [],
  },
];

const STAKE_PRESETS = [10, 25, 50, 100, 250];

type WagerStatus = 'pending' | 'won' | 'lost';

interface WagerHistoryEntry {
  id: string;
  title: string;
  amount: number;
  status: WagerStatus;
  payout?: number;
  time: string;
}

const MOCK_WAGER_HISTORY: WagerHistoryEntry[] = [
  { id: 'w1', title: 'Bet White Win', amount: 50, status: 'won', payout: 94.5, time: '00:32 ago' },
  { id: 'w2', title: 'Bet Draw', amount: 25, status: 'pending', time: '02:18 ago' },
  { id: 'w3', title: 'Bet Black Move ...Nf6', amount: 15, status: 'lost', time: '05:51 ago' },
  { id: 'w4', title: 'Bet White Move Bc4', amount: 20, status: 'won', payout: 56, time: '11:05 ago' },
];
const TestBoardPage: React.FC = () => {
  const snapshots = useMemo<Snapshot[]>(() => {
    const chess = new Chess();
    const initial: Snapshot[] = [{
      fen: chess.fen(),
      label: 'Starting Position',
      eval: 0,
      lastMove: undefined,
      turn: chess.turn(),
    }];

    DEMO_MOVES.forEach(({ move, label, eval: evalScore }) => {
      const result = chess.move(move, { sloppy: true });
      if (result) {
        initial.push({
          fen: chess.fen(),
          label,
          eval: evalScore,
          lastMove: [result.from, result.to],
          turn: chess.turn(),
        });
      }
    });

    return initial;
  }, []);

  const [boardSize, setBoardSize] = useState(420);
  const [maxBoardSize, setMaxBoardSize] = useState(420);
  const [positionIndex, setPositionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverArrow, setHoverArrow] = useState<[Key, Key] | null>(null);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [outcomeStates, setOutcomeStates] = useState<Record<OutcomeId, OutcomeVisualState>>({
    black_win: 'idle',
    draw: 'idle',
    white_win: 'idle',
  });
  const [devOutcomeMode, setDevOutcomeMode] = useState<Record<OutcomeId, OutcomeDevMode>>({
    black_win: 'success',
    draw: 'success',
    white_win: 'success',
  });
  const outcomeResetTimers = useRef<Record<OutcomeId, number | null>>({
    black_win: null,
    draw: null,
    white_win: null,
  });
  const [moveStates, setMoveStates] = useState<Record<string, MoveVisualState>>({});
  const [moveDevMode, setMoveDevMode] = useState<MoveDevMode>('success');
  const moveResetTimers = useRef<Record<string, number | null>>({});
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    startSize: 420,
    anchorTop: null as number | null,
  });
  const boardFrameRef = useRef<HTMLDivElement | null>(null);
  const [selectedStake, setSelectedStake] = useState(STAKE_PRESETS[2]);

  useEffect(() => {
    const computeMax = () => {
      if (typeof window === 'undefined') return 420;
      const widthBound = window.innerWidth - 80;
      const heightBound = window.innerHeight - 220;
      return Math.max(MIN_BOARD_SIZE, Math.min(640, widthBound, heightBound));
    };
    const handler = () => {
      const nextMax = computeMax();
      setMaxBoardSize(nextMax);
      setBoardSize((prev) => Math.min(nextMax, Math.max(MIN_BOARD_SIZE, prev)));
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const latestSnapshotIndex = useMemo(() => (
    Math.max(0, snapshots.length - 1)
  ), [snapshots.length]);

  const notationPairs = useMemo<NotationPair[]>(() => {
    const pairs: NotationPair[] = [];
    let moveNumber = 1;
    for (let index = 1; index < snapshots.length; moveNumber += 1) {
      const whiteSnapshot = snapshots[index];
      const blackSnapshot = snapshots[index + 1];
      const pair: NotationPair = {
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
      };
      pairs.push(pair);
      index += 2;
    }
    return pairs;
  }, [snapshots]);

  useEffect(() => {
    setPositionIndex((prev) => Math.min(prev, latestSnapshotIndex));
  }, [latestSnapshotIndex]);

  const handleStep = useCallback((direction: 1 | -1) => {
    setPositionIndex((prev) => {
      const next = Math.min(latestSnapshotIndex, Math.max(0, prev + direction));
      return next;
    });
  }, [latestSnapshotIndex]);

  const handleSelectSnapshot = useCallback((index: number) => {
    const nextIndex = Math.min(latestSnapshotIndex, Math.max(0, index));
    setPositionIndex(nextIndex);
  }, [latestSnapshotIndex]);

  const handleJumpToLive = useCallback(() => {
    setPositionIndex(latestSnapshotIndex);
  }, [latestSnapshotIndex]);

  const activeSnapshot = snapshots[positionIndex] ?? snapshots[0];
  const isAtLatestSnapshot = positionIndex === latestSnapshotIndex;
  const betsLocked = !isAtLatestSnapshot;
  const evalWidth = 60;
  const arrowShapes = useMemo(() => (
    hoverArrow ? [{
      orig: hoverArrow[0],
      dest: hoverArrow[1],
      brush: 'green',
    }] : []
  ), [hoverArrow]);

  const boardConfig = useMemo<Config>(() => ({
    fen: activeSnapshot.fen,
    coordinates: true,
    viewOnly: true,
    animation: { enabled: true, duration: 450 },
    orientation: 'white',
    lastMove: activeSnapshot.lastMove,
    drawable: {
      enabled: true,
      visible: true,
      autoShapes: arrowShapes,
      defaultSnapToValidMove: false,
    },
  }), [activeSnapshot, arrowShapes]);

  const evalScore = activeSnapshot.eval;
  const evalPercent = Math.max(0, Math.min(100, ((evalScore + 1) / 2) * 100));

  const whiteClock = formatClock(300 - positionIndex * 7);
  const blackClock = formatClock(300 - positionIndex * 5);
  const isWhiteTurn = activeSnapshot.turn === 'w';
  const isBlackTurn = !isWhiteTurn;
  const moveSetIndex = positionIndex % MOVE_SETS.length;
  const activeMoveSet = MOVE_SETS[moveSetIndex] ?? { whiteMoves: [], blackMoves: [] };
  const whiteMovePool = activeMoveSet.whiteMoves ?? [];
  const blackMovePool = activeMoveSet.blackMoves ?? [];
  const mobileMovePool = isWhiteTurn ? whiteMovePool : blackMovePool;
  const mobileMoveOwner = isWhiteTurn ? PLAYER_WHITE : PLAYER_BLACK;
  const squareSize = boardSize / 8;
  const evalBarWidth = Math.max(14, squareSize / 2);

  const MIN_CAP = 8;
  const MIN_BLUE = 8;
  let whiteShare = Math.max(MIN_CAP, evalPercent);
  let blackShare = Math.max(MIN_CAP, 100 - evalPercent);
  let blueShare = 100 - whiteShare - blackShare;
  if (blueShare < MIN_BLUE) {
    const deficit = MIN_BLUE - blueShare;
    if (whiteShare > blackShare) {
      whiteShare = Math.max(MIN_CAP, whiteShare - deficit);
    } else {
      blackShare = Math.max(MIN_CAP, blackShare - deficit);
    }
    blueShare = MIN_BLUE;
  }
  const totalShare = whiteShare + blackShare + blueShare;
  whiteShare = (whiteShare / totalShare) * 100;
  blackShare = (blackShare / totalShare) * 100;
  blueShare = 100 - whiteShare - blackShare;

  const handleOutcomeBet = useCallback((outcomeId: string) => {
    console.log('Bet outcome', outcomeId);
  }, []);

  const handleDevOutcomeModeChange = useCallback((outcomeId: OutcomeId, mode: OutcomeDevMode) => {
    setDevOutcomeMode((prev) => ({ ...prev, [outcomeId]: mode }));
  }, []);

  const handleDevMoveModeChange = useCallback((mode: MoveDevMode) => {
    setMoveDevMode(mode);
  }, []);

  const updateOutcomeState = useCallback((outcomeId: OutcomeId, next: OutcomeVisualState) => {
    setOutcomeStates((prev) => {
      if (prev[outcomeId] === next) return prev;
      console.log(`[dev] outcome ${outcomeId} -> ${next}`);
      return { ...prev, [outcomeId]: next };
    });
  }, []);

  const scheduleOutcomeReset = useCallback((outcomeId: OutcomeId, delay: number) => {
    const currentTimer = outcomeResetTimers.current[outcomeId];
    if (currentTimer) {
      window.clearTimeout(currentTimer);
    }
    const timerId = window.setTimeout(() => {
      updateOutcomeState(outcomeId, 'idle');
      outcomeResetTimers.current[outcomeId] = null;
    }, delay);
    outcomeResetTimers.current[outcomeId] = timerId;
  }, [updateOutcomeState]);

  const triggerOutcomeBet = useCallback((outcomeId: OutcomeId) => {
    if (!isAtLatestSnapshot) return;
    let started = false;
    setOutcomeStates((prev) => {
      if (prev[outcomeId] === 'loading') return prev;
      started = true;
      return { ...prev, [outcomeId]: 'loading' };
    });
    if (!started) return;

    const simulate = async () => {
      await new Promise((resolve) => setTimeout(resolve, 320 + Math.random() * 200));
      handleOutcomeBet(outcomeId);
      const outcome = devOutcomeMode[outcomeId];
      if (outcome === 'success') {
        updateOutcomeState(outcomeId, 'success');
        scheduleOutcomeReset(outcomeId, 420);
      } else {
        updateOutcomeState(outcomeId, 'error');
        scheduleOutcomeReset(outcomeId, 520);
      }
    };

    simulate().catch(() => {
      updateOutcomeState(outcomeId, 'error');
      scheduleOutcomeReset(outcomeId, 520);
    });
  }, [devOutcomeMode, handleOutcomeBet, isAtLatestSnapshot, scheduleOutcomeReset, updateOutcomeState]);

  const updateMoveState = useCallback((moveKey: string, next: MoveVisualState) => {
    setMoveStates((prev) => {
      if (prev[moveKey] === next) return prev;
      console.log(`[dev] move ${moveKey} -> ${next}`);
      return { ...prev, [moveKey]: next };
    });
  }, []);

  const scheduleMoveReset = useCallback((moveKey: string, delay: number) => {
    const activeTimer = moveResetTimers.current[moveKey];
    if (activeTimer) window.clearTimeout(activeTimer);
    const timerId = window.setTimeout(() => {
      updateMoveState(moveKey, 'idle');
      moveResetTimers.current[moveKey] = null;
    }, delay);
    moveResetTimers.current[moveKey] = timerId;
  }, [updateMoveState]);

  const handleMoveBet = useCallback((move: string) => {
    if (!isAtLatestSnapshot) return;
    const moveKey = `${positionIndex}-${move}`;
    if (moveStates[moveKey] === 'loading') return;
    updateMoveState(moveKey, 'loading');

    const simulate = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 180));
      console.log('Bet move', move);
      if (moveDevMode === 'success') {
        updateMoveState(moveKey, 'success');
        scheduleMoveReset(moveKey, 400);
      } else {
        updateMoveState(moveKey, 'error');
        scheduleMoveReset(moveKey, 520);
      }
    };

    simulate().catch(() => {
      updateMoveState(moveKey, 'error');
      scheduleMoveReset(moveKey, 520);
    });
  }, [isAtLatestSnapshot, moveDevMode, moveStates, positionIndex, scheduleMoveReset, updateMoveState]);

  const normalizeMoveNotation = useCallback((move: string) => (
    move
      .replace(/^\d+\.{1}\s*/, '')
      .replace(/^\.{3}\s*/, '')
      .trim()
  ), []);

  const sanitizeMoveLabel = useCallback((move: string) => normalizeMoveNotation(move), [normalizeMoveNotation]);

  const formatEvalDisplay = useCallback((value: number) => (
    value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
  ), []);

  const computeArrowForMove = useCallback((move: string): [Key, Key] | null => {
    try {
      const chess = new Chess(activeSnapshot.fen);
      const candidate = chess.move(normalizeMoveNotation(move), { sloppy: true });
      if (candidate) {
        return [candidate.from as Key, candidate.to as Key];
      }
    } catch (error) {
      console.warn('Unable to draw arrow for move', move, error);
    }
    return null;
  }, [activeSnapshot.fen, normalizeMoveNotation]);

  const handleMoveHoverStart = useCallback((move: string) => {
    const arrow = computeArrowForMove(move);
    setHoverArrow(arrow);
  }, [computeArrowForMove]);

  const handleMoveHoverEnd = useCallback(() => {
    setHoverArrow(null);
  }, []);

  useEffect(() => {
    setHoverArrow(null);
  }, [activeSnapshot.fen]);

  useEffect(() => () => {
    (Object.keys(outcomeResetTimers.current) as OutcomeId[]).forEach((outcomeId) => {
      const timer = outcomeResetTimers.current[outcomeId];
      if (timer) window.clearTimeout(timer);
    });
  }, []);

  const renderMoveOptions = (options: MoveOption[], color: 'white' | 'black', isLocked: boolean) => {
    if (!options.length) {
      return (
        <div className="move-panel__empty">
          {color === 'white' ? 'Waiting on White' : 'Waiting on Black'}
        </div>
      );
    }

    return options.map((option) => {
      const moveKey = `${positionIndex}-${option.move}`;
      const visualState = moveStates[moveKey] ?? 'idle';
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
          disabled={isLocked}
        >
          <span>{sanitizeMoveLabel(option.move)}</span>
          <span>{`${option.percent}% • ${option.payout.toFixed(1)}x`}</span>
        </button>
      );
    });
  };

  const renderMovePanel = (
    color: 'white' | 'black',
    alignmentClass: 'move-panel--top' | 'move-panel--bottom',
    isActive: boolean,
    options: MoveOption[],
    isLocked: boolean,
  ) => (
    <div
      className={[
        'move-panel',
        alignmentClass,
        isActive ? 'move-panel--expanded' : 'move-panel--collapsed',
        isLocked ? 'move-panel--locked' : '',
      ].join(' ')}
      data-locked={isLocked}
      aria-live={isActive ? 'polite' : 'off'}
    >
      {isActive ? renderMoveOptions(options, color, isLocked) : (
        <div className="move-panel__status">
          {isLocked ? 'Historical snapshot' : color === 'white' ? 'Awaiting Black move' : 'Awaiting White move'}
        </div>
      )}
    </div>
  );

  const renderNotationMove = (
    entry: NotationEntry | undefined,
    color: 'white' | 'black',
  ) => {
    if (!entry) {
      return (
        <span className={[
          'notation-row__move-button',
          'notation-row__move-button--empty',
          `notation-row__move-button--${color}`,
        ].join(' ')}
        >
          —
        </span>
      );
    }

    const isActive = positionIndex === entry.index;
    const isLatest = entry.index === latestSnapshotIndex;
    return (
      <button
        type="button"
        className={[
          'notation-row__move-button',
          `notation-row__move-button--${color}`,
          isActive ? 'is-active' : '',
          isLatest ? 'is-latest' : '',
        ].join(' ')}
        onClick={() => handleSelectSnapshot(entry.index)}
      >
        <span className="notation-row__move">
          {sanitizeMoveLabel(entry.label)}
        </span>
        <span className="notation-row__meta">
          {formatEvalDisplay(entry.eval)}
        </span>
      </button>
    );
  };

  const renderOutcomeButton = (
    outcomeId: OutcomeId,
    label: string,
    variant: 'white' | 'black' | 'draw',
  ) => {
    const visualState = outcomeStates[outcomeId];
    const isDisabled = visualState === 'loading' || betsLocked;
    return (
      <button
        type="button"
        className={`outcome-rail__button outcome-rail__button--${variant} state-${visualState}`}
        data-state={visualState}
        data-locked={betsLocked}
        onClick={() => triggerOutcomeBet(outcomeId)}
        disabled={isDisabled}
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
          disabled={betsLocked}
        >
          <span className="mobile-move-chip__label">{sanitizeMoveLabel(option.move)}</span>
          <span className="mobile-move-chip__meta">
            {option.percent}% · {option.payout.toFixed(1)}x
          </span>
        </button>
      );
    })
  ) : (
    <div className="mobile-move-chip mobile-move-chip--empty">
      Waiting on {isWhiteTurn ? 'Black' : 'White'} to move
    </div>
  );

  const clampSize = useCallback((value: number) => (
    Math.max(MIN_BOARD_SIZE, Math.min(maxBoardSize, value))
  ), [maxBoardSize]);

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
    setIsDragging(true);
  }, [boardSize]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const clientX = (event instanceof TouchEvent) ? event.touches[0]?.clientX ?? dragStateRef.current.startX : event.clientX;
      const clientY = (event instanceof TouchEvent) ? event.touches[0]?.clientY ?? dragStateRef.current.startY : event.clientY;
      const deltaX = clientX - dragStateRef.current.startX;
      const deltaY = clientY - dragStateRef.current.startY;
      const delta = Math.max(deltaX, deltaY);
      const nextSize = clampSize(dragStateRef.current.startSize + delta);
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


  return (
    <div className="test-board-page">
      <NavBar compact={true} />
      <div className="test-board-page__content">
        <button
          type="button"
          className={`dev-floating-toggle ${isDevPanelOpen ? 'is-open' : ''}`}
          onClick={() => setIsDevPanelOpen((prev) => !prev)}
        >
          {isDevPanelOpen ? 'Close Dev Panel' : 'Dev Tools'}
        </button>

        {isDevPanelOpen && (
          <div className="test-dev-panel">
            <div className="test-dev-panel__section">
              <div className="test-dev-panel__title">Outcome Modes</div>
              <div className="dev-outcome-grid">
                {OUTCOME_SEQUENCE.map((outcomeId) => (
                  <label key={`mode-${outcomeId}`} className="dev-outcome-control">
                    <span>{OUTCOME_LABELS[outcomeId]}</span>
                    <select
                      value={devOutcomeMode[outcomeId]}
                      onChange={(event) => handleDevOutcomeModeChange(outcomeId, event.target.value as OutcomeDevMode)}
                    >
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="test-dev-panel__section">
              <div className="test-dev-panel__title">Outcome States</div>
              <div className="dev-outcome-states">
                {OUTCOME_SEQUENCE.map((outcomeId) => (
                  <div key={`state-${outcomeId}`} className="dev-outcome-state">
                    <span>{OUTCOME_LABELS[outcomeId]}</span>
                    <strong>{outcomeStates[outcomeId]}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="board-demo">
          <div className="board-layout">
            <div className="board-layout__main">
              <aside className="notation-rail">
                <div className="notation-rail__header">
                  <div>
                    <div className="notation-rail__title">Moves</div>
                    <div className="notation-rail__subtitle">
                      {isAtLatestSnapshot ? 'Live position' : 'Historical view'}
                    </div>
                  </div>
                  {!isAtLatestSnapshot && (
                    <span className="notation-rail__status-tag">Not Live</span>
                  )}
                </div>
                <div className="notation-rail__list">
                  {notationPairs.length ? notationPairs.map((pair) => (
                    <div
                      key={`notation-move-${pair.moveNumber}`}
                      className="notation-row"
                    >
                      <span className="notation-row__number">{pair.moveNumber}.</span>
                      {renderNotationMove(pair.white, 'white')}
                      {renderNotationMove(pair.black, 'black')}
                    </div>
                  )) : (
                    <div className="notation-row notation-row--empty">
                      <span className="notation-row__move">
                        Moves will appear here
                      </span>
                    </div>
                  )}
                </div>
                <div className="notation-rail__playback">
                  <button type="button" onClick={() => handleStep(-1)} disabled={positionIndex === 0}>
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    disabled={positionIndex === latestSnapshotIndex}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToLive}
                    disabled={isAtLatestSnapshot}
                  >
                    Jump to Live
                  </button>
                </div>
              </aside>
              <div
                ref={boardFrameRef}
                className={`board-frame ${!isAtLatestSnapshot ? 'board-frame--rewound' : ''}`}
                style={{ width: boardSize + evalWidth + 48 }}
              >
                <div className="player-header">
                  <div className="player-meta">
                    <span className="player-name">{PLAYER_BLACK.name}</span>
                    <span className="player-rating">{PLAYER_BLACK.rating}</span>
                  </div>
                  <div className="player-clock-group">
                    <span className="player-clock">{blackClock}</span>
                  </div>
                </div>

                <div className="board-eval-stack" style={{ width: boardSize + evalWidth, gap: 12 }}>
                  <div className="board-shell" style={{ width: boardSize, height: boardSize }}>
                    <div className="chessboard-wrapper brown" style={{ width: '100%', height: '100%' }}>
                      <ChessgroundWrapper config={boardConfig} />
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
                    <span className="player-name">{PLAYER_WHITE.name}</span>
                    <span className="player-rating">{PLAYER_WHITE.rating}</span>
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
            </div>
            <div
              className={['outcome-rail-column', betsLocked ? 'is-locked' : ''].join(' ')}
              data-locked={betsLocked}
            >
              <div className="outcome-rail-column__item">
                <header>
                  <span>Black</span>
                  {renderOutcomeButton('black_win', `Bet ${PLAYER_BLACK.name.split(' ')[0]}`, 'black')}
                </header>
                {renderMovePanel('black', 'move-panel--top', isBlackTurn, blackMovePool, betsLocked)}
              </div>
              <div className="draw-panel">
                {renderOutcomeButton('draw', 'Bet Draw', 'draw')}
                <div className="draw-panel__hint">Hold for instant draw bet</div>
              </div>
              <div className="outcome-rail-column__item">
                <header>
                  <span>White</span>
                  {renderOutcomeButton('white_win', `Bet ${PLAYER_WHITE.name.split(' ')[0]}`, 'white')}
                </header>
                {renderMovePanel('white', 'move-panel--bottom', isWhiteTurn, whiteMovePool, betsLocked)}
              </div>
            </div>
          </div>
        </div>
        <div className="desktop-post-board">
          <section className="game-controls-card">
            <header>
              <div>
                <div className="card-label">Game Controls</div>
                <div className="card-sub">
                  Configure stake & playback
                </div>
              </div>
              <span className={`live-pill ${isAtLatestSnapshot ? 'is-live' : 'is-paused'}`}>
                {isAtLatestSnapshot ? 'Live' : 'Not Live'}
              </span>
            </header>
            <div className="game-controls-card__stakes">
              {STAKE_PRESETS.map((value) => (
                <button
                  key={`stake-${value}`}
                  type="button"
                  className={`stake-chip ${selectedStake === value ? 'is-active' : ''}`}
                  onClick={() => setSelectedStake(value)}
                >
                  ${value}
                </button>
              ))}
            </div>
            <div className="game-controls-card__actions">
              <div className="game-controls-card__summary">
                <span>Selected Stake</span>
                <strong>${selectedStake.toFixed(2)}</strong>
              </div>
              <button
                type="button"
                className="primary-action"
                onClick={handleJumpToLive}
                disabled={isAtLatestSnapshot}
              >
                Jump to Live
              </button>
              <button
                type="button"
                className="primary-action"
                disabled={betsLocked}
              >
                {betsLocked ? 'Historical View' : 'Confirm Stake'}
              </button>
            </div>
            <div className="game-controls-card__hint">
              {betsLocked ? 'Rewound positions lock betting. Jump to the live move to resume.' : 'Stake ready. Bets update instantly when live.'}
            </div>
          </section>
          <section className="wager-history-card">
            <header>
              <div className="card-label">Wager History</div>
              <div className="card-sub">Sandboxed events</div>
            </header>
            <div className="wager-history-card__list">
              {MOCK_WAGER_HISTORY.map((entry) => (
                <div
                  key={entry.id}
                  className={`wager-history-row wager-history-row--${entry.status}`}
                >
                  <div>
                    <div className="wager-history-row__title">{entry.title}</div>
                    <div className="wager-history-row__meta">{entry.time}</div>
                  </div>
                  <div className="wager-history-row__amount">
                    ${entry.amount.toFixed(2)}
                    {entry.status === 'won' && entry.payout ? (
                      <span>+${entry.payout.toFixed(2)}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mobile-move-market">
          <div className="mobile-move-market__header">
            <div>
              <span className="mobile-move-market__label">
                {isWhiteTurn ? 'White to move' : 'Black to move'}
              </span>
              <span className="mobile-move-market__sub">
                {mobileMoveOwner.name} • {mobileMoveOwner.rating}
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
            {renderOutcomeButton('black_win', `Bet ${PLAYER_BLACK.name.split(' ')[0]}`, 'black')}
            {renderOutcomeButton('draw', 'Bet Draw', 'draw')}
            {renderOutcomeButton('white_win', `Bet ${PLAYER_WHITE.name.split(' ')[0]}`, 'white')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBoardPage;
