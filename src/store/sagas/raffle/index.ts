import { all } from 'redux-saga/effects';
import {
  watchFetchCurrentRaffles,
  watchFetchRaffleHistory,
  watchOptInToRaffle
} from './watchers';

export default function* raffleSaga() {
  yield all([
    watchFetchCurrentRaffles(),
    watchFetchRaffleHistory(),
    watchOptInToRaffle(),
  ]);
}