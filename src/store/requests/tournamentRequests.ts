import { createBackendAxiosRequest } from 'store/requests';
import { RequestReturnType } from 'types/state';
import {
  Tournament,
  TournamentRoundDetail,
  TournamentGame,
} from 'types/tournament';

/**
 * Fetch all available tournaments
 */
export const fetchTournaments = async (): Promise<RequestReturnType<Tournament[]>> => {
  const result = await createBackendAxiosRequest<Tournament[]>({
    method: 'GET',
    url: '/tournaments/',
  });

  return result;
};

/**
 * Fetch a specific tournament by ID
 */
export const fetchTournamentById = async (id: string): Promise<RequestReturnType<Tournament>> => {
  const result = await createBackendAxiosRequest<Tournament>({
    method: 'GET',
    url: `/tournaments/${id}`,
  });

  return result;
};

/**
 * Fetch a specific round with games from a tournament
 */
export const fetchTournamentRound = async (
  tournamentId: string,
  roundId: string,
): Promise<RequestReturnType<TournamentRoundDetail>> => {
  const result = await createBackendAxiosRequest<TournamentRoundDetail>({
    method: 'GET',
    url: `/tournaments/${tournamentId}/rounds/${roundId}/games`,
  });

  return result;
};

/**
 * Fetch a specific game from a tournament round
 */
export const fetchTournamentGame = async (
  tournamentId: string,
  roundId: string,
  gameId: string,
): Promise<RequestReturnType<TournamentGame>> => {
  // Try the direct game lookup first (which uses the flattened index)
  try {
    console.log(`Attempting direct game lookup for gameId: ${gameId}`);
    const result = await createBackendAxiosRequest<TournamentGame>({
      method: 'GET',
      url: `/tournaments/games/${gameId}`,
    });

    console.log(`Direct game lookup successful for gameId: ${gameId}`);
    return result;
  } catch (error) {
    console.log(`Direct game lookup failed for gameId: ${gameId}, falling back to full path`);

    // Fall back to the full path if the direct lookup fails
    const result = await createBackendAxiosRequest<TournamentGame>({
      method: 'GET',
      url: `/tournaments/${tournamentId}/rounds/${roundId}/games/${gameId}`,
    });

    return result;
  }
};

/**
 * Get the URL for a tournament round's event stream
 */
export const getTournamentStreamUrl = (tournamentId: string, roundId: string): string => {
  return `${process.env.ROOT_URL || 'http://localhost:9090'}/tournaments/${tournamentId}/rounds/${roundId}/stream`;
};

/**
 * Get the URL for a tournament game's event stream
 */
export const getTournamentGameStreamUrl = (
  tournamentId: string,
  roundId: string,
  gameId: string,
): string => {
  return `${process.env.ROOT_URL || 'http://localhost:9090'}/tournaments/${tournamentId}/rounds/${roundId}/games/${gameId}/stream`;
};