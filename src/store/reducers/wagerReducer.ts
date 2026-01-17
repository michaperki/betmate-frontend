import { WagerState } from 'types/resources/wager';
import { Actions } from 'types/state';

const initialState: WagerState = {
  wagers: {},
  activeWagers: [],
  wagerHistory: [],
  stats: {
    totalWagers: 0,
    winRate: 0
  },
  loading: false,
  error: null,
  errorCode: undefined,
};

const wagerReducer = (state = initialState, action: Actions): WagerState => {
  // Handle loading states
  if (action.status === 'REQUEST') {
    switch (action.type) {
      case 'CREATE_WAGER':
        return {
          ...state,
          // clear any stale error before new attempt
          error: null,
          errorCode: undefined,
        };
      case 'FETCH_USER_BETTING_STATS':
      case 'FETCH_ACTIVE_WAGERS':
      case 'FETCH_WAGER_HISTORY':
        return {
          ...state,
          loading: true,
          error: null
        };
      default:
        return state;
    }
  }

  // Handle error states
  if (action.status === 'FAILURE') {
    switch (action.type) {
      case 'CREATE_WAGER':
        return {
          ...state,
          error: action.payload.message || 'Failed to create wager',
          errorCode: (action as any).payload?.code,
          loading: false,
        };
      case 'FETCH_USER_BETTING_STATS':
      case 'FETCH_ACTIVE_WAGERS':
      case 'FETCH_WAGER_HISTORY':
        return {
          ...state,
          loading: false,
          error: action.payload.message
        };
      default:
        return state;
    }
  }

  // Handle success states
  if (action.status === 'SUCCESS') {
    switch (action.type) {
      case 'CREATE_WAGER':
      case 'FETCH_WAGER':
        return {
          ...state,
          wagers: {
            ...state.wagers,
            [action.payload._id]: action.payload,
          },
          error: null,
          errorCode: undefined,
        };

      case 'FETCH_WAGERS':
        return {
          ...state,
          wagers: action.payload.reduce((accum, wager) => ({
            ...accum,
            [wager._id]: wager,
          }), state.wagers),
        };

      case 'FETCH_USER_BETTING_STATS':
        return {
          ...state,
          stats: action.payload,
          loading: false,
          error: null
        };

      case 'FETCH_ACTIVE_WAGERS':
        return {
          ...state,
          activeWagers: action.payload,
          loading: false,
          error: null
        };

      case 'FETCH_WAGER_HISTORY':
        return {
          ...state,
          wagerHistory: action.payload,
          loading: false,
          error: null
        };

      case 'DEAUTH_USER':
        return initialState;

      default:
        return state;
    }
  }

  return state;
};

export default wagerReducer;
