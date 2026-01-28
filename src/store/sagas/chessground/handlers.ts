/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { put, select } from 'redux-saga/effects';
import { applyMoveState, createArrows } from 'store/actionCreators/chessgroundActionCreators';
import { FetchGameActions, UpdateGameOddsActions, UpdateGameStateActions } from 'types/resources/game';
import { Actions, RootState } from 'types/state';

export function* handleGameStateUpdate(action: FetchGameActions | UpdateGameStateActions) {
  if (action.status !== 'SUCCESS') return;

  const { state, move_hist: moveHist } = action.payload;
  yield put<Actions>(applyMoveState(state, moveHist));
}

export function* handleGameOddsUpdate(action: FetchGameActions | UpdateGameOddsActions) {
  if (action.status !== 'SUCCESS') return;

  const gameId = action.type === 'FETCH_GAME'
    ? action.payload._id
    : action.payload.gameId;

  const { options } = action.payload.pool_wagers.move;
  const gameState: string = yield select((state: RootState) => state.game.games[gameId].state);

  yield put<Actions>(createArrows(gameState, options));
}
