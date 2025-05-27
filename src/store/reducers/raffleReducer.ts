import { 
  RaffleState, 
  RaffleActions, 
  FETCH_CURRENT_RAFFLES,
  FETCH_RAFFLE_HISTORY,
  OPT_IN_TO_RAFFLE,
  SET_RAFFLE_LOADING
} from 'types/resources/raffle';
import { REQUEST, SUCCESS, FAILURE } from 'types/state';

const initialState: RaffleState = {
  currentRaffles: [],
  raffleHistory: [],
  loading: false,
  error: null,
  optInLoading: false,
  historyPagination: {
    page: 1,
    limit: 10,
    hasMore: true,
  },
};

export default function raffleReducer(
  state = initialState,
  action: RaffleActions
): RaffleState {
  switch (action.type) {
    case FETCH_CURRENT_RAFFLES:
      switch (action.status) {
        case REQUEST:
          return {
            ...state,
            loading: true,
            error: null,
          };
        case SUCCESS:
          return {
            ...state,
            loading: false,
            currentRaffles: action.payload.currentRaffles,
            error: null,
          };
        case FAILURE:
          return {
            ...state,
            loading: false,
            error: action.payload.message,
          };
        default:
          return state;
      }

    case FETCH_RAFFLE_HISTORY:
      switch (action.status) {
        case REQUEST:
          return {
            ...state,
            loading: true,
            error: null,
          };
        case SUCCESS:
          return {
            ...state,
            loading: false,
            raffleHistory: action.payload.raffleHistory,
            historyPagination: action.payload.pagination,
            error: null,
          };
        case FAILURE:
          return {
            ...state,
            loading: false,
            error: action.payload.message,
          };
        default:
          return state;
      }

    case OPT_IN_TO_RAFFLE:
      switch (action.status) {
        case REQUEST:
          return {
            ...state,
            error: null,
          };
        case SUCCESS:
          return {
            ...state,
            error: null,
          };
        case FAILURE:
          return {
            ...state,
            error: action.payload.message,
          };
        default:
          return state;
      }

    case SET_RAFFLE_LOADING:
      return {
        ...state,
        optInLoading: action.payload.loading,
      };

    default:
      return state;
  }
}