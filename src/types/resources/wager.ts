/* eslint-disable import/no-cycle */
import { AsyncAction } from 'types/state';

export type WagerWDL = 'win' | 'draw' | 'loss';

export enum WagerStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export interface Wager {
  _id: string,
  game_id: string,
  better_id: string,
  wdl: boolean,
  amount: number,
  odds: number,
  data: string,
  move_number: number,
  resolved: boolean,
  status: WagerStatus,
  winning_pool_share: number,
  created_at: string,
  updated_at: string,
  is_bot?: boolean,
  notification_status?: string,
  display_status?: string,
  ticket_number?: string,
  resolution_details?: string,
}

export interface FeedWager extends Wager {
  time: string
  type: 'wager'
}

/* -------- State -------- */

export interface UserBettingStats {
  totalWagers: number;
  winRate: number;
}

export interface WagerState {
  wagers: Record<string, Wager>,
  activeWagers: Wager[],
  wagerHistory: Wager[],
  stats: UserBettingStats,
  loading: boolean,
  error: string | null,
}

/* -------- Action Types -------- */

export const CREATE_WAGER = 'CREATE_WAGER';
export const FETCH_WAGER = 'FETCH_WAGER';
export const FETCH_WAGERS = 'FETCH_WAGERS';
export const FETCH_USER_BETTING_STATS = 'FETCH_USER_BETTING_STATS';
export const FETCH_ACTIVE_WAGERS = 'FETCH_ACTIVE_WAGERS';
export const FETCH_WAGER_HISTORY = 'FETCH_WAGER_HISTORY';

export type CreateWagerRequestData = {
  gameId: string,
  wager: string,
  amount: number,
  wdl: boolean,
  odds: number,
  moveNumber: number,
  mode?: 'arcade' | 'real',
  currency?: 'BET' | 'USDT',
};
export type FetchWagerRequestData = { id: string };
export type DeleteWagerRequestData = { id: string };
export type FetchWagerHistoryRequestData = {
  status?: WagerStatus,
  limit?: number,
  skip?: number
};

export type FetchWagerData = Wager;
export type FetchWagersData = Wager[];
export type FetchUserBettingStatsData = UserBettingStats;
export type FetchActiveWagersData = Wager[];
export type FetchWagerHistoryData = Wager[];
export type WagerResultData = { gameId: string, wagers: Wager[] }; // ws

export type CreateWagerActions = AsyncAction<typeof CREATE_WAGER, FetchWagerData, CreateWagerRequestData>;
export type FetchWagerActions = AsyncAction<typeof FETCH_WAGER, FetchWagerData, FetchWagerRequestData>;
export type FetchWagersActions = AsyncAction<typeof FETCH_WAGERS, FetchWagersData>;
export type FetchUserBettingStatsActions = AsyncAction<typeof FETCH_USER_BETTING_STATS, FetchUserBettingStatsData>;
export type FetchActiveWagersActions = AsyncAction<typeof FETCH_ACTIVE_WAGERS, FetchActiveWagersData>;
export type FetchWagerHistoryActions = AsyncAction<typeof FETCH_WAGER_HISTORY, FetchWagerHistoryData, FetchWagerHistoryRequestData>;

export type WagerActions =
  | CreateWagerActions
  | FetchWagerActions
  | FetchWagersActions
  | FetchUserBettingStatsActions
  | FetchActiveWagersActions
  | FetchWagerHistoryActions;

export type WagerActionTypes =
  | typeof CREATE_WAGER
  | typeof FETCH_WAGER
  | typeof FETCH_WAGERS
  | typeof FETCH_USER_BETTING_STATS
  | typeof FETCH_ACTIVE_WAGERS
  | typeof FETCH_WAGER_HISTORY;
