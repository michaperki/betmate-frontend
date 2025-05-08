import { GameStatus } from 'types/resources/game';
import { Chess as chess } from 'chess.js';
import { DrawShape } from 'chessground/draw';
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

const BRUSH_NAMES = ['green', 'red', 'blue', 'yellow'];

export const getBrush = (state: string): (move: string, i: number) => DrawShape | null => {
  const game = chess(state);

  return (move: string, i: number): DrawShape | null => {
    const m = game.move(move);
    game.undo();
    if (!m) {
      return null;
    }
    const brush = BRUSH_NAMES[i % BRUSH_NAMES.length];
    return {
      orig: m.from,
      dest: m.to,
      brush,
    } as DrawShape;
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
