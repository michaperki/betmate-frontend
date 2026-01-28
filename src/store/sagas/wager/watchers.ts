/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { call, take, put } from 'redux-saga/effects';

import * as wagerRequests from 'store/requests/wagerRequests';
import { getErrorPayload } from 'utils/error';
import { emit as emitNotification } from 'components/NotificationCenter/bus';
import { readableBet } from 'utils/wager';
import { formatAmountShort, modeCurrency } from 'utils/currency';
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
    // Keep a reference to the latest request for contextual logging on failure
    let lastRequest: CreateWagerActions | undefined;
    try {
      const action: CreateWagerActions = yield take((a: Actions) => (a.type === 'CREATE_WAGER' && a.status === 'REQUEST'));
      lastRequest = action;
      if (action.status !== 'REQUEST') continue; // Type protection only

      // Optimistically adjust Arcade balance only if we have a token present
      const token = getBearerToken();
      if (action.payload.amount && action.payload.mode !== 'real' && token) {
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
        action.payload.mode,
        action.payload.currency,
      );
      // Dev-friendly console log for accepted wagers (no UI toast)
      try {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.info('[CREATE_WAGER] success', {
            gameId: action.payload.gameId,
            data: action.payload.wager,
            wdl: action.payload.wdl,
            amount: action.payload.amount,
            mode: action.payload.mode,
            wagerId: response?.data?._id,
          });
        }
      } catch {}
      yield put<Actions>({ type: 'CREATE_WAGER', payload: response.data, status: 'SUCCESS' });

      // UI toast: Bet placed
      try {
        const w = response?.data as any;
        const curr = (w?.currency as any) || modeCurrency((w?.mode as any) || 'arcade');
        const readable = readableBet(!!w?.wdl, String(w?.data));
        const amt = typeof w?.amount === 'number' ? formatAmountShort(w.amount, curr) : '';
        emitNotification({ type: 'success', title: 'Bet Placed', message: `${amt} on ${readable} @ ${w?.odds}x`, icon: '✓' });
      } catch {}

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
      // Dev-friendly console log for rejected wagers
      try {
        if (process.env.NODE_ENV !== 'production') {
          const err = getErrorPayload(error);
          // eslint-disable-next-line no-console
          console.info('[CREATE_WAGER] failure', {
            message: err.message,
            code: (err as any).code,
            gameId: (lastRequest as any)?.payload?.gameId,
            data: (lastRequest as any)?.payload?.wager,
            wdl: (lastRequest as any)?.payload?.wdl,
            amount: (lastRequest as any)?.payload?.amount,
            mode: (lastRequest as any)?.payload?.mode,
          });
          // also attach global for quick inspection
          (window as any).__bmLastWagerError = { ...err, at: Date.now(), context: (lastRequest as any)?.payload };
        }
      } catch {}
      const errPayload = getErrorPayload(error);
      yield put<Actions>({ type: 'CREATE_WAGER', payload: errPayload, status: 'FAILURE' });
      try {
        const code = (errPayload as any)?.code;
        const title = 'Bet Rejected';
        let message = String((errPayload as any)?.message || 'Please try again');
        if (typeof code === 'string' && code.startsWith('CAP_')) {
          message += ` (${code.replace('CAP_', '').replace(/_/g, ' ').toLowerCase()})`;
          emitNotification({
            type: 'error',
            title,
            message,
            icon: '⚠️',
            actionLabel: 'Why?',
            onAction: () => { try { window.dispatchEvent(new CustomEvent('betmate:open-help', { detail: 'risk' })); } catch {} },
          } as any);
        } else {
          emitNotification({ type: 'error', title, message, icon: '⚠️' });
        }
      } catch {}
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

      // If not authenticated, return default stats to avoid 401 spam
      if (!getBearerToken()) {
        yield put<Actions>({
          type: 'FETCH_USER_BETTING_STATS',
          payload: { totalWagers: 0, winRate: 0 },
          status: 'SUCCESS'
        });
        continue;
      }

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

      // If not authenticated, return empty list to avoid 401 spam
      if (!getBearerToken()) {
        yield put<Actions>({
          type: 'FETCH_ACTIVE_WAGERS',
          payload: [],
          status: 'SUCCESS'
        });
        continue;
      }

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

      // If not authenticated, return empty list to avoid 401 spam
      if (!getBearerToken()) {
        yield put<Actions>({
          type: 'FETCH_WAGER_HISTORY',
          payload: [],
          status: 'SUCCESS'
        });
        continue;
      }

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
