import { GameStatus } from 'types/resources/game';
import { Chess as chess } from 'chess.js';
import { DrawShape } from 'chessground/draw';
import { Key } from 'chessground/types';
import { FromTo } from 'types/chessground';

export const getMultiplier = (odd: number): number => {
  if (odd <= 0) {
    return 0;
  }
  if (odd < 2) {
    return parseFloat(odd.toFixed(2));
  }
  if (odd < 10) {
    return parseFloat(odd.toFixed(1));
  }
  return Math.round(odd);
};

export const CHESS_START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const gameOver = (game_status: GameStatus): boolean => {
  const gameOverStatuses: GameStatus[] = [
    GameStatus.WHITE_WIN,
    GameStatus.BLACK_WIN,
    GameStatus.DRAW,
    GameStatus.ABORTED,
  ];
  return gameOverStatuses.includes(game_status);
};

export const gameInProgress = (game_status: GameStatus): boolean => {
  return game_status === GameStatus.IN_PROGRESS;
};

export const getFromTo = (state: string, move: string): FromTo => {
  const game = chess(state);
  const m = game.move(move);
  return {
    from: m?.from ?? '',
    to: m?.to ?? '',
  };
};

/**
 * Gets all valid moves from the current position in standard chess.js map format
 * Returns a Map where keys are source squares and values are arrays of destination squares
 */
export const getValidMoves = (fen: string): Map<Key, Key[]> => {
  const game = chess(fen);
  const dests = new Map<Key, Key[]>();

  // Get all squares with pieces that can move
  const squares = game.SQUARES;

  squares.forEach(s => {
    const piece = game.get(s);
    // Skip empty squares and pieces that can't move
    if (piece) {
      // Get valid moves from this square
      const moves = game.moves({ square: s, verbose: true });
      if (moves.length) {
        // Store destinations for this origin square
        dests.set(s as Key, moves.map(m => m.to as Key));
      }
    }
  });

  return dests;
};

const BRUSH_NAMES = ['green', 'red', 'blue', 'yellow'];

export const getBrush = (state: string): (move: string, i: number) => DrawShape | null => {
  if (!state) {
    console.error('Invalid state passed to getBrush');
    return () => null;
  }

  // Create a fresh chess instance for each state
  const game = chess(state);

  return (move: string, i: number): DrawShape | null => {
    if (!move) {
      console.error('Invalid move passed to getBrush');
      return null;
    }

    // First attempt - standard notation
    try {
      const m = game.move(move);

      if (m) {
        game.undo();
        const brush = BRUSH_NAMES[i % BRUSH_NAMES.length];

        // Create DrawShape with only the required properties
        const shape: DrawShape = {
          orig: m.from,
          dest: m.to,
          brush,
        };

        return shape;
      }

      game.undo(); // Make sure to undo even failed moves to reset state
    } catch (e) {
      // Standard notation failed, trying sloppy
    }
    // Second attempt - sloppy notation
    try {
      const m = game.move(move, { sloppy: true });

      if (m) {
        game.undo();
        const brush = BRUSH_NAMES[i % BRUSH_NAMES.length];

        // Create DrawShape with only the required properties
        const shape: DrawShape = {
          orig: m.from,
          dest: m.to,
          brush,
        };

        return shape;
      }

      game.undo();
    } catch (e2) {
      console.error('All move parsing attempts failed for:', move, e2);
    }

    // If we get here, all attempts failed
    return null;
  };
};

export const selectDrawshape = (autoShapes: DrawShape[], move: FromTo): DrawShape[] => {
  return autoShapes.filter(
    (s) => s.orig === move.from && s.dest === move.to,
  );
};

export const fromToEqual = (a: FromTo, b: FromTo): boolean => {
  return a.to === b.to && a.from === b.from;
};
