import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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

const MIN_BOARD_SIZE = 260;

interface MoveOption {
  move: string;
  percent: number;
  payout: number;
}

interface MoveSet {
  whiteMoves: MoveOption[];
  blackMoves: MoveOption[];
}

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ startX: 0, startY: 0, startSize: 420 });

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

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => {
      setPositionIndex((prev) => (prev + 1) % snapshots.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, snapshots.length]);

  const handleStep = useCallback((direction: 1 | -1) => {
    setPositionIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return snapshots.length - 1;
      return next % snapshots.length;
    });
  }, [snapshots.length]);

  const activeSnapshot = snapshots[positionIndex] ?? snapshots[0];
  const evalWidth = 60;
  const headerHeight = 64;

  const boardConfig = useMemo<Config>(() => ({
    fen: activeSnapshot.fen,
    coordinates: true,
    viewOnly: true,
    animation: { enabled: true, duration: 450 },
    orientation: 'white',
    lastMove: activeSnapshot.lastMove,
  }), [activeSnapshot]);

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

  const handleMoveBet = useCallback((move: string) => {
    console.log('Bet move', move);
  }, []);

  const renderMoveOptions = (options: MoveOption[], color: 'white' | 'black') => {
    if (!options.length) {
      return (
        <div className="move-panel__empty">
          {color === 'white' ? 'Waiting on White' : 'Waiting on Black'}
        </div>
      );
    }

    return options.map((option) => (
      <button
        key={`${color}-${option.move}`}
        type="button"
        onClick={() => handleMoveBet(option.move)}
      >
        <span>{option.move}</span>
        <span>{`${option.percent}% • ${option.payout.toFixed(1)}x`}</span>
      </button>
    ));
  };

  const renderMovePanel = (
    color: 'white' | 'black',
    alignmentClass: 'move-panel--top' | 'move-panel--bottom',
    isActive: boolean,
    options: MoveOption[],
  ) => (
    <div
      className={[
        'move-panel',
        alignmentClass,
        isActive ? 'move-panel--expanded' : 'move-panel--collapsed',
      ].join(' ')}
      aria-live={isActive ? 'polite' : 'off'}
    >
      {isActive ? renderMoveOptions(options, color) : (
        <div className="move-panel__status">
          {color === 'white' ? 'Awaiting Black move' : 'Awaiting White move'}
        </div>
      )}
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
    const handleEnd = () => setIsDragging(false);
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

  return (
    <div className="test-board-page">
      <NavBar compact={true} />
      <div className="test-board-page__content">
        <div className="test-board-controls">
          <div className="playback-controls">
            <button type="button" onClick={() => handleStep(-1)}>Prev</button>
            <button type="button" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? 'Pause Loop' : 'Play Loop'}
            </button>
            <button type="button" onClick={() => handleStep(1)}>Next</button>
            <span>{activeSnapshot.label}</span>
          </div>
        </div>

        <div className="board-demo">
          <div className="board-layout">
            <div
              className="board-frame"
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

            <div className="outcome-rail-column">
              <div className="outcome-rail-column__item">
                <header>
                  <span>Black</span>
                  <button
                    type="button"
                    className="outcome-rail__button black"
                    onClick={() => handleOutcomeBet('black_win')}
                  >
                    Bet {PLAYER_BLACK.name.split(' ')[0]}
                  </button>
                </header>
                {renderMovePanel('black', 'move-panel--top', isBlackTurn, blackMovePool)}
              </div>
              <div className="draw-panel">
                <button
                  type="button"
                  className="outcome-rail__button draw"
                  onClick={() => handleOutcomeBet('draw')}
                >
                  Bet Draw
                </button>
                <div className="draw-panel__hint">Hold for instant draw bet</div>
              </div>
              <div className="outcome-rail-column__item">
                <header>
                  <span>White</span>
                  <button
                    type="button"
                    className="outcome-rail__button white"
                    onClick={() => handleOutcomeBet('white_win')}
                  >
                    Bet {PLAYER_WHITE.name.split(' ')[0]}
                  </button>
                </header>
                {renderMovePanel('white', 'move-panel--bottom', isWhiteTurn, whiteMovePool)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBoardPage;
