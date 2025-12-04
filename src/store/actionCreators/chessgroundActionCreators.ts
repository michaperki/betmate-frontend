import { DrawShape } from 'chessground/draw';
import { KeyPair } from 'chessground/types';

import { Move } from 'types/resources/game';
import { Actions } from 'types/state';
import { getBrush } from 'utils/chess';

export const newMove = (state: string, moveHist: Move[]): Actions => {
  const hasLastMove = moveHist.length > 0;
  const lm = hasLastMove
    ? moveHist[moveHist.length - 1]
    : undefined;

  return {
    type: 'CG_NEW_MOVE',
    status: 'SUCCESS',
    payload: {
      newState: state,
      lastMove: lm && [lm.from, lm.to] as KeyPair,
    },
  };
};

export const onEnterMovePanel = (): Actions => {
  return {
    type: 'CG_ENTER_MOVE_PANEL',
    status: 'SUCCESS',
    payload: {},
  };
};

export const onLeaveMovePanel = (): Actions => ({
  type: 'CG_LEAVE_MOVE_PANEL',
  status: 'SUCCESS',
  payload: {},
});

export const createNewArrows = (state: string, moveOptions: string[]): Actions => {
  const newArrows = moveOptions
    .map((move, index) => {
      const brush = getBrush(state)(move, index);
      return brush;
    })
    .filter((m): m is DrawShape => !!m);

  return {
    type: 'CG_NEW_ARROWS',
    status: 'SUCCESS',
    payload: newArrows,
  };
};

export const onMoveHover = (shapes: Array<{ orig: string; dest: string }>): Actions => {
  if (!shapes || shapes.length === 0 || !shapes[0].orig || !shapes[0].dest) {
    // Return a properly formatted empty action
    return {
      type: 'CG_MOVE_UNHOVER',
      status: 'SUCCESS',
      payload: {},
    };
  }

  return {
    type: 'CG_MOVE_HOVER',
    status: 'SUCCESS',
    payload: {
      from: shapes[0].orig,
      to: shapes[0].dest,
    },
  };
};

export const onMoveUnhover = (): Actions => ({
  type: 'CG_MOVE_UNHOVER',
  status: 'SUCCESS',
  payload: {},
});
