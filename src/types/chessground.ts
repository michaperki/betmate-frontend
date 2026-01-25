/* eslint-disable import/no-cycle */
import { Config } from 'chessground/config';
import { KeyPair } from 'chessground/types';
import { DrawShape } from 'chessground/draw';
import { Action } from './state';

/* -------- State -------- */

export type FromTo = { from: string, to: string };

export interface ChessgroundState {
  config: Config,
  autoShapes: DrawShape[]
  showAutoShapes: boolean
  selected?: FromTo;
}

/* -------- Action Types -------- */

export const CG_NEW_MOVE = 'CG_NEW_MOVE';
export const CG_ENTER_MOVE_PANEL = 'CG_ENTER_MOVE_PANEL';
export const CG_LEAVE_MOVE_PANEL = 'CG_LEAVE_MOVE_PANEL';
export const CG_NEW_ARROWS = 'CG_NEW_ARROWS';
export const CG_MOVE_HOVER = 'CG_MOVE_HOVER';
export const CG_MOVE_UNHOVER = 'CG_MOVE_UNHOVER';

export type CgMoveData = { newState: string, lastMove?: KeyPair };
export type CgArrowsData = DrawShape[];
export type CgMoveSelectData = FromTo;
export type CgMoveHoverData = FromTo;

export type CgMoveActions = Action<typeof CG_NEW_MOVE, CgMoveData>;
export type CgEnterMovePanelActions = Action<typeof CG_ENTER_MOVE_PANEL>;
export type CgLeaveMovePanelActions = Action<typeof CG_LEAVE_MOVE_PANEL>;
export type CgArrowsActions = Action<typeof CG_NEW_ARROWS, CgArrowsData>;
export type CgMoveHoverActions = Action<typeof CG_MOVE_HOVER, CgMoveHoverData>;
export type CgMoveUnhoverActions = Action<typeof CG_MOVE_UNHOVER>;

export type CgActions =
    CgMoveActions | CgEnterMovePanelActions | CgLeaveMovePanelActions |
    CgArrowsActions | CgMoveHoverActions | CgMoveUnhoverActions;

export type CgActionTypes =
    typeof CG_NEW_MOVE | typeof CG_ENTER_MOVE_PANEL | typeof CG_LEAVE_MOVE_PANEL |
    typeof CG_NEW_ARROWS | typeof CG_MOVE_HOVER | typeof CG_MOVE_UNHOVER;

// Backwards-compat type aliases
export type CgNewMoveData = CgMoveData;
export type CgNewArrowsData = CgArrowsData;
export type CgNewMoveActions = CgMoveActions;
export type CgNewArrowsActions = CgArrowsActions;
