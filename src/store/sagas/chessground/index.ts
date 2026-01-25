/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { takeEvery } from 'redux-saga/effects';
import { ActionTypes } from 'types/state';
import { handleGameOddsUpdate, handleGameStateUpdate } from './handlers';

export default function* chessgroundSaga() {
  yield takeEvery<ActionTypes[]>(['FETCH_GAME', 'UPDATE_GAME_STATE'], handleGameStateUpdate);
  yield takeEvery<ActionTypes[]>(['FETCH_GAME', 'UPDATE_GAME_ODDS'], handleGameOddsUpdate);
}
