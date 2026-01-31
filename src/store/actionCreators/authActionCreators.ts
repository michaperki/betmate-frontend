import {
  BalanceHistoryItem,
  GET_BALANCE_HISTORY,
  VERIFY_EMAIL,
  CHECK_EMAIL_VERIFICATION_STATUS,
  RESEND_VERIFICATION_EMAIL
} from 'types/resources/auth';
import { Actions } from 'types/state';
import { authTokenName } from 'utils';

export const signUpUser = (email: string, password: string, firstName: string, lastName: string, invite_code: string, device_id?: string): Actions => ({
  type: 'CREATE_USER',
  status: 'REQUEST',
  payload: {
    email,
    password,
    firstName,
    lastName,
    invite_code,
    device_id,
  },
});

export const signInUser = (email: string, password: string): Actions => ({
  type: 'SIGN_IN_USER',
  status: 'REQUEST',
  payload: {
    email,
    password,
  },
});

export const signOutUser = (): Actions => ({
  type: 'DEAUTH_USER',
  status: 'SUCCESS',
  payload: {},
});

export const jwtSignIn = (): Actions => ({
  type: 'JWT_SIGN_IN',
  status: 'REQUEST',
  payload: { token: localStorage.getItem(authTokenName) || '' },
});

export const getBalanceHistory = (limit = 30, currency?: 'BET' | 'USDT'): Actions => ({
  type: GET_BALANCE_HISTORY,
  status: 'REQUEST',
  payload: { limit, currency },
});

export const getBalanceHistorySuccess = (history: BalanceHistoryItem[]): Actions => ({
  type: GET_BALANCE_HISTORY,
  status: 'SUCCESS',
  payload: history,
});

export const getBalanceHistoryFailure = (error: string): Actions => ({
  type: GET_BALANCE_HISTORY,
  status: 'FAILURE',
  payload: { message: error, code: null },
});

// Email verification actions
export const verifyEmail = (token: string): Actions => ({
  type: VERIFY_EMAIL,
  status: 'REQUEST',
  payload: { token },
});

export const checkEmailVerificationStatus = (): Actions => ({
  type: CHECK_EMAIL_VERIFICATION_STATUS,
  status: 'REQUEST',
  payload: {},
});

export const resendVerificationEmail = (email?: string): Actions => ({
  type: RESEND_VERIFICATION_EMAIL,
  status: 'REQUEST',
  payload: { email },
});
