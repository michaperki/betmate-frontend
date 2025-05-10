/**
 * Tournament action definitions
 */
import { 
  Tournament, 
  TournamentRoundDetail, 
  TournamentGame,
  TournamentActionTypes 
} from './tournament';
import { AsyncAction } from './state';

export type FetchTournamentsActions = AsyncAction<
  TournamentActionTypes.FETCH_TOURNAMENTS,
  Tournament[]
>;

export type FetchTournamentActions = AsyncAction<
  TournamentActionTypes.FETCH_TOURNAMENT,
  Tournament,
  { id: string }
>;

export type FetchRoundActions = AsyncAction<
  TournamentActionTypes.FETCH_ROUND,
  TournamentRoundDetail,
  { tournamentId: string, roundId: string }
>;

export type FetchGameActions = AsyncAction<
  TournamentActionTypes.FETCH_GAME,
  TournamentGame,
  { tournamentId: string, roundId: string, gameId: string }
>;

export type UpdateGameAction = {
  type: TournamentActionTypes.UPDATE_GAME;
  status: 'SUCCESS';
  payload: any;
};

export type ClearTournamentAction = {
  type: TournamentActionTypes.CLEAR_TOURNAMENT;
  status: 'SUCCESS';
  payload: undefined;
};

export type ClearRoundAction = {
  type: TournamentActionTypes.CLEAR_ROUND;
  status: 'SUCCESS';
  payload: undefined;
};

export type ClearGameAction = {
  type: TournamentActionTypes.CLEAR_GAME;
  status: 'SUCCESS';
  payload: undefined;
};

export type TournamentActions = 
  FetchTournamentsActions | 
  FetchTournamentActions | 
  FetchRoundActions | 
  FetchGameActions |
  UpdateGameAction |
  ClearTournamentAction |
  ClearRoundAction |
  ClearGameAction;