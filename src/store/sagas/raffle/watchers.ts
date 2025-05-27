import { takeEvery } from 'redux-saga/effects';
import {
  FETCH_CURRENT_RAFFLES,
  FETCH_RAFFLE_HISTORY,
  OPT_IN_TO_RAFFLE
} from 'types/resources/raffle';
import { REQUEST } from 'types/state';
import {
  handleFetchCurrentRaffles,
  handleFetchRaffleHistory,
  handleOptInToRaffle
} from './handlers';

export function* watchFetchCurrentRaffles() {
  yield takeEvery((action: any) => 
    action.type === FETCH_CURRENT_RAFFLES && action.status === REQUEST, 
    handleFetchCurrentRaffles
  );
}

export function* watchFetchRaffleHistory() {
  yield takeEvery((action: any) => 
    action.type === FETCH_RAFFLE_HISTORY && action.status === REQUEST, 
    handleFetchRaffleHistory
  );
}

export function* watchOptInToRaffle() {
  yield takeEvery((action: any) => 
    action.type === OPT_IN_TO_RAFFLE && action.status === REQUEST, 
    handleOptInToRaffle
  );
}