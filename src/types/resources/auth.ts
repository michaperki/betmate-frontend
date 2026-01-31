/* eslint-disable import/no-cycle */
import { Empty } from 'types';
import { Action, AsyncAction } from 'types/state';

/* -------- State -------- */

export enum UserRole {
  USER = 'user',
  STREAMER = 'streamer',
  ADMIN = 'admin',
}

export interface User {
  email: string
  first_name: string
  last_name: string
  full_name: string
  // Legacy token balance field kept for back-compat only
  account?: number
  // Primary Arcade balance going forward
  token_balance?: number
  cash_balance?: number
  onboarding_version_seen?: number
  role?: UserRole
  _id: string
  is_bot?: boolean
  email_verified?: boolean
}

export interface BalanceHistoryItem {
  _id: string
  user_id: string
  amount: number
  balance: number
  currency?: 'BET' | 'USDT'
  reason: string
  reference_id?: string
  reference_type?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  isAuthenticated: boolean,
  user: User | null,
  balanceHistory: BalanceHistoryItem[],
  loadingBalanceHistory: boolean,
  balanceHistoryError: string | null,
  emailVerificationStatus: {
    verified: boolean,
    required: boolean
  } | null,
  verificationStatus: 'pending' | 'verified' | 'failed' | null,
  verificationError: string | null,
}

/* -------- Action Types -------- */

export const SIGN_IN_USER = 'SIGN_IN_USER';
export const DEAUTH_USER = 'DEAUTH_USER';
export const CREATE_USER = 'CREATE_USER';
export const JWT_SIGN_IN = 'JWT_SIGN_IN';
export const GET_BALANCE_HISTORY = 'GET_BALANCE_HISTORY';
export const ADJUST_BALANCE = 'ADJUST_BALANCE';
export const SET_BALANCE = 'SET_BALANCE';
export const VERIFY_EMAIL = 'VERIFY_EMAIL';
export const RESEND_VERIFICATION_EMAIL = 'RESEND_VERIFICATION_EMAIL';
export const CHECK_EMAIL_VERIFICATION_STATUS = 'CHECK_EMAIL_VERIFICATION_STATUS';

export type CreateUserRequestData = { email: string, password: string, firstName: string, lastName: string, invite_code: string, device_id?: string };
export type SignInRequestData = { email: string, password: string };
export type JwtSignInRequestData = { token: string };
export type GetBalanceHistoryRequestData = { limit?: number, currency?: 'BET' | 'USDT' };
export type VerifyEmailRequestData = { token: string };
export type ResendVerificationEmailRequestData = { email?: string };
export type CheckEmailVerificationStatusRequestData = Record<string, never>;

export type AuthUserResponseData = { user: User, token: string, emailVerificationRequired?: boolean };
export type JwtSignInResponseData = { user: User };
export type BalanceHistoryResponseData = BalanceHistoryItem[];
export type VerifyEmailResponseData = { message: string, verified: boolean, user: User };
export type EmailVerificationStatusResponseData = { verified: boolean, required: boolean };

export type DeAuthUserData = Empty;
export type ResendVerificationEmailResponseData = { sent: boolean };

export type CreateUserActions = AsyncAction<typeof CREATE_USER, AuthUserResponseData, CreateUserRequestData>;
export type SignInUserActions = AsyncAction<typeof SIGN_IN_USER, AuthUserResponseData, SignInRequestData>;
export type JwtSignInActions = AsyncAction<typeof JWT_SIGN_IN, JwtSignInResponseData, JwtSignInRequestData>;
export type DeAuthUserActions = Action<typeof DEAUTH_USER, DeAuthUserData>;
export type GetBalanceHistoryActions = AsyncAction<typeof GET_BALANCE_HISTORY, BalanceHistoryResponseData, GetBalanceHistoryRequestData>;
export type AdjustBalanceActions = Action<typeof ADJUST_BALANCE, { delta: number }>;
export type SetBalanceActions = Action<typeof SET_BALANCE, { balance: number }>;
export type VerifyEmailActions = AsyncAction<typeof VERIFY_EMAIL, VerifyEmailResponseData, VerifyEmailRequestData>;
export type ResendVerificationEmailActions = AsyncAction<typeof RESEND_VERIFICATION_EMAIL, ResendVerificationEmailResponseData, ResendVerificationEmailRequestData>;
export type CheckEmailVerificationStatusActions = AsyncAction<typeof CHECK_EMAIL_VERIFICATION_STATUS, EmailVerificationStatusResponseData, CheckEmailVerificationStatusRequestData>;

export type AuthActions =
  | CreateUserActions
  | SignInUserActions
  | DeAuthUserActions
  | JwtSignInActions
  | GetBalanceHistoryActions
  | AdjustBalanceActions
  | SetBalanceActions
  | VerifyEmailActions
  | ResendVerificationEmailActions
  | CheckEmailVerificationStatusActions;

export type AuthActionTypes =
  | typeof CREATE_USER
  | typeof SIGN_IN_USER
  | typeof DEAUTH_USER
  | typeof JWT_SIGN_IN
  | typeof GET_BALANCE_HISTORY
  | typeof ADJUST_BALANCE
  | typeof SET_BALANCE
  | typeof VERIFY_EMAIL
  | typeof RESEND_VERIFICATION_EMAIL
  | typeof CHECK_EMAIL_VERIFICATION_STATUS;
