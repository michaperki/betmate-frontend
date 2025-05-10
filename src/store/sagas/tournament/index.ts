/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { fork } from 'redux-saga/effects';
import * as tournamentWatchers from 'store/sagas/tournament/watchers';

export default function* tournamentSaga() {
  yield fork(tournamentWatchers.watchFetchAllTournaments);
  yield fork(tournamentWatchers.watchFetchTournament);
  yield fork(tournamentWatchers.watchFetchRound);
  yield fork(tournamentWatchers.watchFetchGame);
}