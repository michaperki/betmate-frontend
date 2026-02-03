import omit from 'lodash.omit';

import { GameState } from 'types/resources/game';
import { Actions } from 'types/state';

const initialState: GameState = {
  games: {},
  showModal: {},
  chats: [],
  quickBetMode: false, // Default to confirmation mode
  pendingBet: null,
  gameStats: {},
};

const gameReducer = (state = initialState, action: Actions): GameState => {
  if (action.status !== 'SUCCESS') return state;

  switch (action.type) {
    case 'FETCH_GAME':
      return {
        ...state,
        games: {
          ...state.games,
          [action.payload._id]: {
            ...state.games[action.payload._id],
            ...action.payload,
          },
        },
      };

    case 'FETCH_GAMES': {
      // Treat FETCH_GAMES as a snapshot of currently active games
      // Remove any games that were previously marked as not_started/in_progress
      // but are not present in the latest payload (they likely ended).
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const incomingIds = new Set(incoming.map((g) => g._id));

      // Filter out stale live games not present in the incoming snapshot
      const prunedExisting = Object.entries(state.games).reduce<Record<string, any>>((acc, [id, g]) => {
        const status = g?.game_status;
        const isLive = status === 'not_started' || status === 'in_progress';
        if (!isLive || incomingIds.has(id)) acc[id] = g;
        return acc;
      }, {});

      // Merge incoming snapshot over the pruned existing set
      const mergedGames = incoming.reduce<Record<string, any>>((acc, game) => {
        acc[game._id] = game;
        return acc;
      }, { ...prunedExisting });

      // Keep showModal defaults for current games only
      const mergedShowModal = incoming.reduce<Record<string, boolean>>((acc, game) => ({
        ...acc,
        [game._id]: state.showModal[game._id] ?? true,
      }), Object.keys(prunedExisting).reduce<Record<string, boolean>>((acc, id) => {
        if (state.showModal[id] != null) acc[id] = state.showModal[id];
        return acc;
      }, {}));

      return {
        ...state,
        games: mergedGames,
        showModal: mergedShowModal,
      };
    }

    case 'CLEAR_GAMES':
      return {
        ...state,
        games: {},
      };

    case 'START_GAME':
    case 'UPDATE_GAME_ODDS':
    case 'UPDATE_GAME_STATE':
    case 'UPDATE_GAME_END':
      return {
        ...state,
        games: {
          ...state.games,
          [action.payload.gameId]: {
            ...state.games[action.payload.gameId],
            ...omit(action.payload, 'gameId'),
          },
        },
      };

    case 'UPDATE_SHOW_MODAL':
      return {
        ...state,
        showModal: {
          ...state.showModal,
          [action.payload.gameId]: action.payload.modalState,
        },
      };

    case 'BROADCAST_POOL_WAGER':
      return {
        ...state,
        games: {
          ...state.games,
          [action.payload.gameId]: {
            ...state.games[action.payload.gameId],
            pool_wagers: {
              ...state.games[action.payload.gameId].pool_wagers,
              [action.payload.type]: {
                ...state.games[action.payload.gameId].pool_wagers[action.payload.type],
                wagers: [
                  ...state.games[action.payload.gameId].pool_wagers[action.payload.type].wagers,
                  { data: action.payload.data, amount: action.payload.amount },
                ],
              },
            },
          },
        },
      };

    case 'GAME_CHAT':
      return {
        ...state,
        chats: [...state.chats, { ...action.payload, type: 'message' }],
      };

    case 'LEAVE_GAME':
      return {
        ...state,
        chats: [],
      };

    case 'TOGGLE_QUICK_BET':
      return {
        ...state,
        quickBetMode: !state.quickBetMode
      };

    case 'SET_PENDING_BET':
      return {
        ...state,
        pendingBet: action.payload
      };

    case 'CLEAR_PENDING_BET':
      return {
        ...state,
        pendingBet: null
      };

    case 'FETCH_GAME_STATS':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          [action.payload.gameId]: action.payload
        }
      };

    case 'UPDATE_VIEWER_COUNT':
      const { gameId, viewerCount } = action.payload;
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          [gameId]: {
            ...state.gameStats[gameId],
            viewerCount
          }
        }
      };

    default:
      return state;
  }
};

export default gameReducer;
