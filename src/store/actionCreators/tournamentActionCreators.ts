import { TournamentActionTypes } from 'types/tournament';
import {
  FetchTournamentsActions,
  FetchTournamentActions,
  FetchRoundActions,
  FetchGameActions,
} from 'types/tournament_actions';

/**
 * Fetch all tournaments
 */
export const fetchAllTournaments = (): FetchTournamentsActions => ({
  type: TournamentActionTypes.FETCH_TOURNAMENTS,
  status: 'REQUEST',
  payload: {},
});

/**
 * Fetch a specific tournament by ID
 */
export const fetchTournament = (id: string): FetchTournamentActions => ({
  type: TournamentActionTypes.FETCH_TOURNAMENT,
  status: 'REQUEST',
  payload: { id },
});

/**
 * Fetch a specific round with games from a tournament
 */
export const fetchRound = (tournamentId: string, roundId: string): FetchRoundActions => ({
  type: TournamentActionTypes.FETCH_ROUND,
  status: 'REQUEST',
  payload: { tournamentId, roundId },
});

/**
 * Fetch a specific game from a tournament round
 */
export const fetchGame = (tournamentId: string, roundId: string, gameId: string): FetchGameActions => ({
  type: TournamentActionTypes.FETCH_GAME,
  status: 'REQUEST',
  payload: { tournamentId, roundId, gameId },
});

/**
 * Update game with new data (e.g., from stream)
 */
export const updateGame = (gameData: any) => ({
  type: TournamentActionTypes.UPDATE_GAME,
  status: 'SUCCESS',
  payload: gameData,
} as const);

/**
 * Clear current tournament
 */
export const clearTournament = () => ({
  type: TournamentActionTypes.CLEAR_TOURNAMENT,
  status: 'SUCCESS',
  payload: {},
} as const);

/**
 * Clear current round
 */
export const clearRound = () => ({
  type: TournamentActionTypes.CLEAR_ROUND,
  status: 'SUCCESS',
  payload: {},
} as const);

/**
 * Clear current game
 */
export const clearGame = () => ({
  type: TournamentActionTypes.CLEAR_GAME,
  status: 'SUCCESS',
  payload: {},
} as const);
