export type RafflePeriod = 'WEEKLY' | 'MONTHLY';
export type RaffleDrawStatus = 'UPCOMING' | 'ACTIVE' | 'DRAWING' | 'COMPLETED';
export type PrizeType = 'GIFT_CARD' | 'BETMATE_CREDITS' | 'MERCHANDISE';

export interface RafflePrize {
  type: PrizeType;
  value: string;
}

export interface RaffleDraw {
  id: string;
  period: RafflePeriod;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  status: RaffleDrawStatus;
  totalParticipants: number;
  totalTickets: number;
  userTickets: number;
  prizes: RafflePrize[];
}

export interface RaffleWinner {
  username: string;
  prizeType: PrizeType;
  prizeValue: string;
}

export interface RaffleHistory {
  id: string;
  period: RafflePeriod;
  startDate: string;
  endDate: string;
  drawnAt: string;
  totalTickets: number;
  winners: RaffleWinner[];
  userParticipated: boolean;
  userTickets: number;
}

export interface CurrentRaffleResponse {
  currentRaffles: RaffleDraw[];
}

export interface RaffleHistoryResponse {
  raffleHistory: RaffleHistory[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface RaffleOptInResponse {
  success: boolean;
  message: string;
  tickets: number;
  ticketId: string;
}

export interface RaffleState {
  currentRaffles: RaffleDraw[];
  raffleHistory: RaffleHistory[];
  loading: boolean;
  error: string | null;
  optInLoading: boolean;
  historyPagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

import { AsyncAction, Action } from '../state';
import { Empty } from 'types';

export const FETCH_CURRENT_RAFFLES = 'FETCH_CURRENT_RAFFLES';
export const FETCH_RAFFLE_HISTORY = 'FETCH_RAFFLE_HISTORY';
export const OPT_IN_TO_RAFFLE = 'OPT_IN_TO_RAFFLE';
export const SET_RAFFLE_LOADING = 'SET_RAFFLE_LOADING';

export type RaffleActionTypes =
  typeof FETCH_CURRENT_RAFFLES |
  typeof FETCH_RAFFLE_HISTORY |
  typeof OPT_IN_TO_RAFFLE |
  typeof SET_RAFFLE_LOADING;

export type FetchCurrentRafflesAction = AsyncAction<typeof FETCH_CURRENT_RAFFLES, CurrentRaffleResponse, Empty>;
export type FetchRaffleHistoryAction = AsyncAction<typeof FETCH_RAFFLE_HISTORY, RaffleHistoryResponse, { page: number; limit: number }>;
export type OptInToRaffleAction = AsyncAction<typeof OPT_IN_TO_RAFFLE, RaffleOptInResponse, { drawId: string }>;
export type SetRaffleLoadingAction = Action<typeof SET_RAFFLE_LOADING, { loading: boolean }>;

export type RaffleActions =
  FetchCurrentRafflesAction |
  FetchRaffleHistoryAction |
  OptInToRaffleAction |
  SetRaffleLoadingAction;