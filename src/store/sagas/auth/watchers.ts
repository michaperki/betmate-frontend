/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { call, take, put, select } from 'redux-saga/effects';

import * as authRequests from 'store/requests/authRequests';
import { getBalanceHistoryFailure, getBalanceHistorySuccess } from 'store/actionCreators/authActionCreators';
import { getErrorPayload } from 'utils/error';

import { Actions, RequestReturnType } from 'types/state';
import {
  AuthUserResponseData, SignInUserActions, CreateUserActions, JwtSignInActions, JwtSignInResponseData,
  GET_BALANCE_HISTORY, BalanceHistoryResponseData, GetBalanceHistoryActions,
  VERIFY_EMAIL, VerifyEmailActions, VerifyEmailResponseData,
  CHECK_EMAIL_VERIFICATION_STATUS, CheckEmailVerificationStatusActions, EmailVerificationStatusResponseData,
  RESEND_VERIFICATION_EMAIL, ResendVerificationEmailActions, ResendVerificationEmailResponseData
} from 'types/resources/auth';
import { setBearerToken, removeBearerToken, getBearerToken, setAuthEmail } from 'store/actionCreators';

export function* watchCreateUser() {
  while (true) {
    try {
      const action: CreateUserActions = yield take((a: Actions) => (a.type === 'CREATE_USER' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<AuthUserResponseData> = yield call(
        authRequests.createUser,
        action.payload.email,
        action.payload.password,
        action.payload.firstName,
        action.payload.lastName,
        (action.payload as any).invite_code,
        (action.payload as any).device_id,
      );

      yield call(setBearerToken, response.data.token);
      try { yield call(setAuthEmail, response.data.user?.email); } catch {}

      yield put<Actions>({ type: 'CREATE_USER', payload: { ...response.data }, status: 'SUCCESS' });
    } catch (error) {
      yield put<Actions>({ type: 'CREATE_USER', payload: getErrorPayload(error), status: 'FAILURE' });
    }
  }
}

export function* watchSignInUser() {
  while (true) {
    try {
      const action: SignInUserActions = yield take((a: Actions) => (a.type === 'SIGN_IN_USER' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      // Persist the email we attempted to sign in with for downstream fallbacks
      try { yield call(setAuthEmail, action.payload.email); } catch {}
      const response: RequestReturnType<AuthUserResponseData> = yield call(authRequests.signInUser, action.payload.email, action.payload.password);

      yield call(setBearerToken, response.data.token);
      try { yield call(setAuthEmail, response.data.user?.email); } catch {}

      yield put<Actions>({ type: 'SIGN_IN_USER', payload: { ...response.data }, status: 'SUCCESS' });
    } catch (error) {
      yield put<Actions>({ type: 'SIGN_IN_USER', payload: getErrorPayload(error), status: 'FAILURE' });
    }
  }
}

export function* watchJwtSignIn() {
  while (true) {
    try {
      const action: JwtSignInActions = yield take((a: Actions) => (a.type === 'JWT_SIGN_IN' && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<JwtSignInResponseData> = yield call(authRequests.jwtSignIn);
      try { yield call(setAuthEmail, response.data.user?.email as any); } catch {}
      yield put<Actions>({ type: 'JWT_SIGN_IN', payload: { user: response.data.user }, status: 'SUCCESS' });
    } catch (error) {
      // If token is invalid/expired (401), clear it so we stop spamming failures
      try {
        const code = (error as any)?.response?.status || (error as any)?.code;
        if (code === 401 || code === '401') removeBearerToken();
      } catch {}
      yield put<Actions>({ type: 'JWT_SIGN_IN', payload: getErrorPayload(error), status: 'FAILURE' });
    }
  }
}

export function* watchGetBalanceHistory() {
  while (true) {
    try {
      const action: GetBalanceHistoryActions = yield take((a: Actions) => (a.type === GET_BALANCE_HISTORY && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      // If not authenticated, short-circuit with empty data to avoid 401 spam and stuck loading states
      const token = getBearerToken();
      if (!token) {
        yield put(getBalanceHistorySuccess([]));
        continue;
      }

      const limit = action.payload.limit || 30;
      const currency = (action.payload as any).currency as ('BET' | 'USDT' | undefined);
      const response: RequestReturnType<BalanceHistoryResponseData> = yield call(authRequests.getBalanceHistory, limit, currency);

      yield put(getBalanceHistorySuccess(response.data));
    } catch (error) {
      yield put(getBalanceHistoryFailure(error.message || 'Failed to fetch balance history'));
    }
  }
}

export function* watchVerifyEmail() {
  while (true) {
    try {
      const action: VerifyEmailActions = yield take((a: Actions) => (a.type === VERIFY_EMAIL && a.status === 'REQUEST'));
      if (action.status !== 'REQUEST') continue; // Type protection only

      const response: RequestReturnType<VerifyEmailResponseData> = yield call(
        authRequests.verifyEmail,
        action.payload.token
      );

      yield put<Actions>({
        type: VERIFY_EMAIL,
        payload: response.data,
        status: 'SUCCESS'
      });
    } catch (error) {
      yield put<Actions>({
        type: VERIFY_EMAIL,
        payload: getErrorPayload(error),
        status: 'FAILURE'
      });
    }
  }
}

export function* watchCheckEmailVerificationStatus() {
  while (true) {
    try {
      const action: CheckEmailVerificationStatusActions = yield take(
        (a: Actions) => (a.type === CHECK_EMAIL_VERIFICATION_STATUS && a.status === 'REQUEST')
      );
      if (action.status !== 'REQUEST') continue; // Type protection only

      // If not authenticated, short-circuit to avoid 401 spam
      const token = getBearerToken();
      if (!token) {
        continue;
      }

      const response: RequestReturnType<EmailVerificationStatusResponseData> = yield call(
        authRequests.checkEmailVerificationStatus
      );

      yield put<Actions>({
        type: CHECK_EMAIL_VERIFICATION_STATUS,
        payload: response.data,
        status: 'SUCCESS'
      });
    } catch (error) {
      yield put<Actions>({
        type: CHECK_EMAIL_VERIFICATION_STATUS,
        payload: getErrorPayload(error),
        status: 'FAILURE'
      });
    }
  }
}

export function* watchResendVerificationEmail() {
  while (true) {
    try {
      const action: ResendVerificationEmailActions = yield take(
        (a: Actions) => (a.type === RESEND_VERIFICATION_EMAIL && a.status === 'REQUEST')
      );
      if (action.status !== 'REQUEST') continue; // Type protection only

      // Prefer email from action; if missing, fall back to current user in state
      let email = action.payload.email as string | undefined;
      if (!email) {
        try {
          const state: any = yield select();
          const userEmail = state?.auth?.user?.email;
          if (typeof userEmail === 'string' && userEmail.includes('@')) email = userEmail;
        } catch {}
      }
      const response: RequestReturnType<ResendVerificationEmailResponseData> = yield call(
        authRequests.resendVerificationEmail,
        email
      );

      yield put<Actions>({
        type: RESEND_VERIFICATION_EMAIL,
        payload: response.data,
        status: 'SUCCESS'
      });
    } catch (error) {
      yield put<Actions>({
        type: RESEND_VERIFICATION_EMAIL,
        payload: getErrorPayload(error),
        status: 'FAILURE'
      });
    }
  }
}
