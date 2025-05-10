/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { call, take, put } from 'redux-saga/effects';

import * as tournamentRequests from 'store/requests/tournamentRequests';
import { getErrorPayload } from 'utils/error';

import { Actions, RequestReturnType } from 'types/state';
import {
  TournamentActionTypes,
  Tournament,
  TournamentRoundDetail,
  TournamentGame,
} from 'types/tournament';

export function* watchFetchAllTournaments() {
  while (true) {
    try {
      yield take((a: Actions) => a.type === TournamentActionTypes.FETCH_TOURNAMENTS && a.status === 'REQUEST');
      const response: RequestReturnType<Tournament[]> = yield call(tournamentRequests.fetchTournaments);
      yield put({
        type: TournamentActionTypes.FETCH_TOURNAMENTS,
        payload: response.data || [],
        status: 'SUCCESS',
      } as Actions);
    } catch (error) {
      yield put({
        type: TournamentActionTypes.FETCH_TOURNAMENTS,
        payload: getErrorPayload(error),
        status: 'FAILURE',
      } as Actions);
    }
  }
}

export function* watchFetchTournament() {
  while (true) {
    try {
      const action = yield take((a: Actions) => a.type === TournamentActionTypes.FETCH_TOURNAMENT && a.status === 'REQUEST');
      const response: RequestReturnType<Tournament> = yield call(tournamentRequests.fetchTournamentById, action.payload.id);
      yield put({
        type: TournamentActionTypes.FETCH_TOURNAMENT,
        payload: response.data || null,
        status: 'SUCCESS',
      } as Actions);
    } catch (error) {
      yield put({
        type: TournamentActionTypes.FETCH_TOURNAMENT,
        payload: getErrorPayload(error),
        status: 'FAILURE',
      } as Actions);
    }
  }
}

export function* watchFetchRound() {
  while (true) {
    try {
      const action = yield take((a: Actions) => a.type === TournamentActionTypes.FETCH_ROUND && a.status === 'REQUEST');
      const response: RequestReturnType<TournamentRoundDetail> = yield call(
        tournamentRequests.fetchTournamentRound,
        action.payload.tournamentId,
        action.payload.roundId,
      );
      yield put({
        type: TournamentActionTypes.FETCH_ROUND,
        payload: response.data || null,
        status: 'SUCCESS',
      } as Actions);
    } catch (error) {
      yield put({
        type: TournamentActionTypes.FETCH_ROUND,
        payload: getErrorPayload(error),
        status: 'FAILURE',
      } as Actions);
    }
  }
}

export function* watchFetchGame() {
  while (true) {
    try {
      const action = yield take((a: Actions) => a.type === TournamentActionTypes.FETCH_GAME && a.status === 'REQUEST');
      const response: RequestReturnType<TournamentGame> = yield call(
        tournamentRequests.fetchTournamentGame,
        action.payload.tournamentId,
        action.payload.roundId,
        action.payload.gameId,
      );
      yield put({
        type: TournamentActionTypes.FETCH_GAME,
        payload: response.data || null,
        status: 'SUCCESS',
      } as Actions);
    } catch (error) {
      yield put({
        type: TournamentActionTypes.FETCH_GAME,
        payload: getErrorPayload(error),
        status: 'FAILURE',
      } as Actions);
    }
  }
}