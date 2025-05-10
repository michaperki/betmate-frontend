/**
 * Tournament and related types for Betmate frontend
 */

/**
 * Tournament round information
 */
export interface TournamentRound {
  id: string;
  name: string;
  status: 'Upcoming' | 'Ongoing' | 'Finished';
}

/**
 * Tournament information
 */
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  url?: string;
  status: 'Upcoming' | 'Ongoing' | 'Finished';
  rounds: TournamentRound[];
}

/**
 * Player information in a tournament game
 */
export interface TournamentPlayer {
  name: string;
  title?: string;
  rating?: number;
}

/**
 * Game information in a tournament round
 */
export interface TournamentGame {
  id: string;
  name?: string;
  players: {
    white: TournamentPlayer;
    black: TournamentPlayer;
  };
  status: string;
  fen?: string;
  pgn?: string;
  lastMove?: string;
}

/**
 * Round detail with games
 */
export interface TournamentRoundDetail {
  id: string;
  name: string;
  status: 'Upcoming' | 'Ongoing' | 'Finished';
  url?: string;
  syncing?: boolean;
  games: TournamentGame[];
}

/**
 * Move information for a tournament game
 */
export interface TournamentMove {
  fen: string;
  lastMove?: string;
  clocks?: {
    white: number;
    black: number;
  };
}

/**
 * Game end event information
 */
export interface TournamentGameEnd {
  winner?: 'white' | 'black';
  status: string;
  fen: string;
}

/**
 * Types for tournament action payloads
 */
export type TournamentRequestPayload = void;
export type TournamentSuccessPayload = Tournament[];
export type TournamentFailurePayload = string;

export type TournamentDetailRequestPayload = string;
export type TournamentDetailSuccessPayload = Tournament;
export type TournamentDetailFailurePayload = string;

export type TournamentRoundRequestPayload = {
  tournamentId: string;
  roundId: string;
};
export type TournamentRoundSuccessPayload = TournamentRoundDetail;
export type TournamentRoundFailurePayload = string;

export type TournamentGameRequestPayload = {
  tournamentId: string;
  roundId: string;
  gameId: string;
};
export type TournamentGameSuccessPayload = TournamentGame;
export type TournamentGameFailurePayload = string;

/**
 * Tournament Redux State
 */
export interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  currentRound: TournamentRoundDetail | null;
  currentGame: TournamentGame | null;
  loading: {
    tournaments: boolean;
    tournament: boolean;
    round: boolean;
    game: boolean;
  };
  error: {
    tournaments: string | null;
    tournament: string | null;
    round: string | null;
    game: string | null;
  };
}

/**
 * Tournament Action Types
 */
export enum TournamentActionTypes {
  FETCH_TOURNAMENTS = 'FETCH_TOURNAMENTS',
  FETCH_TOURNAMENT = 'FETCH_TOURNAMENT',
  FETCH_ROUND = 'FETCH_ROUND',
  FETCH_GAME = 'FETCH_GAME',
  CLEAR_TOURNAMENT = 'CLEAR_TOURNAMENT',
  CLEAR_ROUND = 'CLEAR_ROUND',
  CLEAR_GAME = 'CLEAR_GAME',
  UPDATE_GAME = 'UPDATE_GAME',
}