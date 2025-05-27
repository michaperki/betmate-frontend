import { call, put } from 'redux-saga/effects';
import { fetchCurrentRaffles, fetchRaffleHistory, optInToRaffle } from 'store/requests';
import {
  FETCH_CURRENT_RAFFLES,
  FETCH_RAFFLE_HISTORY,
  OPT_IN_TO_RAFFLE,
  CurrentRaffleResponse,
  RaffleHistoryResponse,
  RaffleOptInResponse
} from 'types/resources/raffle';
import { REQUEST, SUCCESS, FAILURE } from 'types/state';

export function* handleFetchCurrentRaffles() {
  try {
    const response: { data: CurrentRaffleResponse } = yield call(fetchCurrentRaffles);
    yield put({
      type: FETCH_CURRENT_RAFFLES,
      status: SUCCESS,
      payload: response.data,
    });
  } catch (error: any) {
    yield put({
      type: FETCH_CURRENT_RAFFLES,
      status: FAILURE,
      payload: {
        message: error.response?.data?.error || 'Failed to fetch current raffles',
        code: error.response?.status || null,
      },
    });
  }
}

export function* handleFetchRaffleHistory(action: any) {
  try {
    const { page = 1, limit = 10 } = action.payload || {};
    const response: { data: RaffleHistoryResponse } = yield call(fetchRaffleHistory, page, limit);
    yield put({
      type: FETCH_RAFFLE_HISTORY,
      status: SUCCESS,
      payload: response.data,
    });
  } catch (error: any) {
    yield put({
      type: FETCH_RAFFLE_HISTORY,
      status: FAILURE,
      payload: {
        message: error.response?.data?.error || 'Failed to fetch raffle history',
        code: error.response?.status || null,
      },
    });
  }
}

export function* handleOptInToRaffle(action: any) {
  try {
    const { drawId } = action.payload;
    const response: { data: RaffleOptInResponse } = yield call(optInToRaffle, drawId);
    yield put({
      type: OPT_IN_TO_RAFFLE,
      status: SUCCESS,
      payload: response.data,
    });
    
    // Refresh current raffles after successful opt-in
    yield put({
      type: FETCH_CURRENT_RAFFLES,
      status: REQUEST,
    });
    yield call(handleFetchCurrentRaffles);
  } catch (error: any) {
    yield put({
      type: OPT_IN_TO_RAFFLE,
      status: FAILURE,
      payload: {
        message: error.response?.data?.error || 'Failed to opt into raffle',
        code: error.response?.status || null,
      },
    });
  }
}