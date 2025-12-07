/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { call, take, put } from 'redux-saga/effects';

import * as wagerRequests from 'store/requests/wagerRequests';
import { getErrorPayload } from 'utils/error';
import { getBearerToken } from 'store/actionCreators';

import { Actions, RequestReturnType } from 'types/state';

import {
  FetchWagerData,
  CreateWagerActions,
  FetchWagerActions,
  FetchWagersActions,
  FetchWagersData,
  FetchUserBettingStatsActions,
  FetchActiveWagersActions,
  FetchWagerHistoryActions,
  FetchUserBettingStatsData,
  FetchActiveWagersData,
  FetchWagerHistoryData,
} from 'types/resources/wager';

export function* watchCreateWager() {
  while (true) {
    try {
      const action: CreateWagerActions = yield take((a: Actions) => (a.type === 'CREATE_WAGER' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      // Optimistically adjust balance immediately
      if (action.payload.amount) {
        yield put({ type: 'ADJUST_BALANCE', status: 'SUCCESS', payload: { delta: -Math.abs(action.payload.amount) } });
      }

      const response: RequestReturnType<FetchWagerData> = yield call(
        wagerRequests.createWager,
        action.payload.gameId,
        action.payload.wager,
        action.payload.amount,
        action.payload.wdl,
        action.payload.odds,
        action.payload.moveNumber,
      );
      yield put<Actions>({ type: 'CREATE_WAGER', payload: response.data, status: 'SUCCESS' });

      // Refresh game stats after successful wager creation
      yield put<Actions>({
        type: 'FETCH_GAME_STATS',
        status: 'REQUEST',
        payload: { id: action.payload.gameId }
      });

      // Refresh wager history so UI panels update without manual reload
      yield put<Actions>({
        type: 'FETCH_WAGER_HISTORY',
        status: 'REQUEST',
        payload: { status: undefined, limit: 10, skip: 0 }
      });

      // Reconcile balance with server (lightweight refresh via JWT flow)
      yield put({ type: 'JWT_SIGN_IN', status: 'REQUEST', payload: { token: getBearerToken() || '' } });
    } catch (error) {
      yield put<Actions>({ type: 'CREATE_WAGER', payload: getErrorPayload(error), status: 'FAILURE' });
      // Roll back optimistic balance if the wager failed to create
      try {
        yield put({ type: 'JWT_SIGN_IN', status: 'REQUEST', payload: { token: getBearerToken() || '' } });
      } catch {}
    }
  }
}

export function* watchFetchWagerById() {
  while (true) {
    try {
      const action: FetchWagerActions = yield take((a: Actions) => (a.type === 'FETCH_WAGER' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<FetchWagerData> = yield call(wagerRequests.fetchWagerById, action.payload.id);
      yield put<Actions>({ type: 'FETCH_WAGER', payload: response.data, status: 'SUCCESS' });
    } catch (error) {
      yield put<Actions>({ type: 'FETCH_WAGER', payload: getErrorPayload(error), status: 'FAILURE' });
    }
  }
}

export function* watchFetchWagers() {
  while (true) {
    try {
      const action: FetchWagersActions = yield take((a: Actions) => (a.type === 'FETCH_WAGERS' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<FetchWagersData> = yield call(wagerRequests.fetchWagers);
      yield put<Actions>({ type: 'FETCH_WAGERS', payload: response.data, status: 'SUCCESS' });
    } catch (error) {
      yield put<Actions>({ type: 'FETCH_WAGERS', payload: getErrorPayload(error), status: 'FAILURE' });
    }
  }
}

export function* watchFetchUserBettingStats() {
  while (true) {
    try {
      const action: FetchUserBettingStatsActions = yield take((a: Actions) =>
        (a.type === 'FETCH_USER_BETTING_STATS' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<FetchUserBettingStatsData> = yield call(wagerRequests.fetchUserBettingStats);
      yield put<Actions>({
        type: 'FETCH_USER_BETTING_STATS',
        payload: response.data,
        status: 'SUCCESS'
      });
    } catch (error) {
      yield put<Actions>({
        type: 'FETCH_USER_BETTING_STATS',
        payload: getErrorPayload(error),
        status: 'FAILURE'
      });
    }
  }
}

export function* watchFetchActiveWagers() {
  while (true) {
    try {
      const action: FetchActiveWagersActions = yield take((a: Actions) =>
        (a.type === 'FETCH_ACTIVE_WAGERS' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<FetchActiveWagersData> = yield call(wagerRequests.fetchActiveWagers);
      yield put<Actions>({
        type: 'FETCH_ACTIVE_WAGERS',
        payload: response.data,
        status: 'SUCCESS'
      });
    } catch (error) {
      yield put<Actions>({
        type: 'FETCH_ACTIVE_WAGERS',
        payload: getErrorPayload(error),
        status: 'FAILURE'
      });
    }
  }
}

export function* watchFetchWagerHistory() {
  while (true) {
    try {
      const action: FetchWagerHistoryActions = yield take((a: Actions) =>
        (a.type === 'FETCH_WAGER_HISTORY' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<FetchWagerHistoryData> = yield call(
        wagerRequests.fetchWagerHistory,
        action.payload.status,
        action.payload.limit,
        action.payload.skip
      );

      yield put<Actions>({
        type: 'FETCH_WAGER_HISTORY',
        payload: response.data,
        status: 'SUCCESS'
      });
    } catch (error) {
      yield put<Actions>({
        type: 'FETCH_WAGER_HISTORY',
        payload: getErrorPayload(error),
        status: 'FAILURE'
      });
    }
  }
}
