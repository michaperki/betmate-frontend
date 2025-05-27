import { Actions } from 'types/state';
import {
  FetchCurrentRafflesAction,
  FetchRaffleHistoryAction,
  OptInToRaffleAction,
  SetRaffleLoadingAction
} from 'types/resources/raffle';

export const fetchCurrentRaffles = (): FetchCurrentRafflesAction => ({
  type: 'FETCH_CURRENT_RAFFLES',
  status: 'REQUEST',
  payload: {},
});

export const fetchRaffleHistory = (page = 1, limit = 10): FetchRaffleHistoryAction => ({
  type: 'FETCH_RAFFLE_HISTORY',
  status: 'REQUEST',
  payload: { page, limit },
});

export const optInToRaffle = (drawId: string): OptInToRaffleAction => ({
  type: 'OPT_IN_TO_RAFFLE',
  status: 'REQUEST',
  payload: { drawId },
});

export const setRaffleLoading = (loading: boolean): SetRaffleLoadingAction => ({
  type: 'SET_RAFFLE_LOADING',
  status: 'SUCCESS',
  payload: { loading },
});