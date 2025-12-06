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
  account: number // This is the user's token balance for betting
  onboarding_version_seen?: number
  role?: UserRole
  _id: string
  is_bot?: boolean
}

export interface BalanceHistoryItem {
  _id: string
  user_id: string
  amount: number
  balance: number
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
}

/* -------- Action Types -------- */

export const SIGN_IN_USER = 'SIGN_IN_USER';
export const DEAUTH_USER = 'DEAUTH_USER';
export const CREATE_USER = 'CREATE_USER';
export const JWT_SIGN_IN = 'JWT_SIGN_IN';
export const GET_BALANCE_HISTORY = 'GET_BALANCE_HISTORY';
export const ADJUST_BALANCE = 'ADJUST_BALANCE';
export const SET_BALANCE = 'SET_BALANCE';

export type CreateUserRequestData = { email: string, password: string, firstName: string, lastName: string };
export type SignInRequestData = { email: string, password: string };
export type JwtSignInRequestData = { token: string };
export type GetBalanceHistoryRequestData = { limit?: number };
export type AuthUserResponseData = { user: User, token: string };
export type JwtSignInResponseData = { user: User };
export type BalanceHistoryResponseData = BalanceHistoryItem[];

export type DeAuthUserData = Empty;

export type CreateUserActions = AsyncAction<typeof CREATE_USER, AuthUserResponseData, CreateUserRequestData>;
export type SignInUserActions = AsyncAction<typeof SIGN_IN_USER, AuthUserResponseData, SignInRequestData>;
export type JwtSignInActions = AsyncAction<typeof JWT_SIGN_IN, JwtSignInResponseData, JwtSignInRequestData>;
export type DeAuthUserActions = Action<typeof DEAUTH_USER, DeAuthUserData>;
export type GetBalanceHistoryActions = AsyncAction<typeof GET_BALANCE_HISTORY, BalanceHistoryResponseData, GetBalanceHistoryRequestData>;
export type AdjustBalanceActions = Action<typeof ADJUST_BALANCE, { delta: number }>;
export type SetBalanceActions = Action<typeof SET_BALANCE, { balance: number }>;

export type AuthActions =
  | CreateUserActions
  | SignInUserActions
  | DeAuthUserActions
  | JwtSignInActions
  | GetBalanceHistoryActions
  | AdjustBalanceActions
  | SetBalanceActions;

export type AuthActionTypes =
  | typeof CREATE_USER
  | typeof SIGN_IN_USER
  | typeof DEAUTH_USER
  | typeof JWT_SIGN_IN
  | typeof GET_BALANCE_HISTORY
  | typeof ADJUST_BALANCE
  | typeof SET_BALANCE;
