import { TournamentActionTypes, TournamentState } from 'types/tournament';
import { AsyncAction } from 'types/state';

// Initial state for tournament reducer
const initialState: TournamentState = {
  tournaments: [],
  currentTournament: null,
  currentRound: null,
  currentGame: null,
  loading: {
    tournaments: false,
    tournament: false,
    round: false,
    game: false,
  },
  error: {
    tournaments: null,
    tournament: null,
    round: null,
    game: null,
  },
};

// Tournament reducer
export default (state = initialState, action: AsyncAction<any, any, any>): TournamentState => {
  switch (action.type) {
    // Fetch tournaments list
    case TournamentActionTypes.FETCH_TOURNAMENTS:
      if (action.status === 'REQUEST') {
        return {
          ...state,
          loading: { ...state.loading, tournaments: true },
          error: { ...state.error, tournaments: null },
        };
      }
      if (action.status === 'SUCCESS') {
        return {
          ...state,
          tournaments: action.payload,
          loading: { ...state.loading, tournaments: false },
        };
      }
      if (action.status === 'FAILURE') {
        return {
          ...state,
          loading: { ...state.loading, tournaments: false },
          error: { ...state.error, tournaments: action.payload.message },
        };
      }
      return state;

    // Fetch specific tournament
    case TournamentActionTypes.FETCH_TOURNAMENT:
      if (action.status === 'REQUEST') {
        return {
          ...state,
          loading: { ...state.loading, tournament: true },
          error: { ...state.error, tournament: null },
        };
      }
      if (action.status === 'SUCCESS') {
        return {
          ...state,
          currentTournament: action.payload,
          loading: { ...state.loading, tournament: false },
        };
      }
      if (action.status === 'FAILURE') {
        return {
          ...state,
          loading: { ...state.loading, tournament: false },
          error: { ...state.error, tournament: action.payload.message },
        };
      }
      return state;

    // Fetch round details
    case TournamentActionTypes.FETCH_ROUND:
      if (action.status === 'REQUEST') {
        return {
          ...state,
          loading: { ...state.loading, round: true },
          error: { ...state.error, round: null },
        };
      }
      if (action.status === 'SUCCESS') {
        return {
          ...state,
          currentRound: action.payload,
          loading: { ...state.loading, round: false },
        };
      }
      if (action.status === 'FAILURE') {
        return {
          ...state,
          loading: { ...state.loading, round: false },
          error: { ...state.error, round: action.payload.message },
        };
      }
      return state;

    // Fetch game details
    case TournamentActionTypes.FETCH_GAME:
      if (action.status === 'REQUEST') {
        return {
          ...state,
          loading: { ...state.loading, game: true },
          error: { ...state.error, game: null },
        };
      }
      if (action.status === 'SUCCESS') {
        return {
          ...state,
          currentGame: action.payload,
          loading: { ...state.loading, game: false },
        };
      }
      if (action.status === 'FAILURE') {
        return {
          ...state,
          loading: { ...state.loading, game: false },
          error: { ...state.error, game: action.payload.message },
        };
      }
      return state;

    // Update current game (e.g., from stream)
    case TournamentActionTypes.UPDATE_GAME:
      if (action.status === 'SUCCESS' && state.currentGame) {
        return {
          ...state,
          currentGame: {
            ...state.currentGame,
            ...action.payload,
          },
        };
      }
      return state;

    // Clear current tournament
    case TournamentActionTypes.CLEAR_TOURNAMENT:
      return {
        ...state,
        currentTournament: null,
        currentRound: null,
        currentGame: null,
        error: {
          ...state.error,
          tournament: null,
          round: null,
          game: null,
        },
      };

    // Clear current round
    case TournamentActionTypes.CLEAR_ROUND:
      return {
        ...state,
        currentRound: null,
        currentGame: null,
        error: {
          ...state.error,
          round: null,
          game: null,
        },
      };

    // Clear current game
    case TournamentActionTypes.CLEAR_GAME:
      return {
        ...state,
        currentGame: null,
        error: {
          ...state.error,
          game: null,
        },
      };

    default:
      return state;
  }
};