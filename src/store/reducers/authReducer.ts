import { AuthState, GET_BALANCE_HISTORY, ADJUST_BALANCE, SET_BALANCE } from 'types/resources/auth';
import { Actions } from 'types/state';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  balanceHistory: [],
  loadingBalanceHistory: false,
  balanceHistoryError: null,
};

const reducer = (state = initialState, action: Actions): AuthState => {
  // Handle GET_BALANCE_HISTORY action with different statuses
  if (action.type === GET_BALANCE_HISTORY) {
    switch (action.status) {
      case 'REQUEST':
        return {
          ...state,
          loadingBalanceHistory: true,
          balanceHistoryError: null,
        };
        
      case 'SUCCESS':
        return {
          ...state,
          balanceHistory: action.payload as any,
          loadingBalanceHistory: false,
        };
        
      case 'FAILURE':
        return {
          ...state,
          loadingBalanceHistory: false,
          balanceHistoryError: action.payload.message,
        };
    }
  }
  
  // Only process the rest of the cases if action.status is SUCCESS
  if (action.status !== 'SUCCESS') return state;
  
  switch (action.type) {
    case ADJUST_BALANCE: {
      // Adjust the user's account balance optimistically
      if (!state.user) return state;
      const delta = Number(action.payload?.delta || 0);
      const next = Math.max(0, (state.user.account || 0) + delta);
      const nextToken = Math.max(0, (state.user.token_balance || state.user.account || 0) + delta);
      return {
        ...state,
        user: {
          ...state.user,
          account: next,
          token_balance: nextToken,
        },
      };
    }

    case SET_BALANCE: {
      if (!state.user) return state;
      const value = Number(action.payload?.balance);
      if (!Number.isFinite(value)) return state;
      return {
        ...state,
        user: {
          ...state.user,
          account: value,
          token_balance: value,
        },
      };
    }
    case 'CREATE_USER':
    case 'JWT_SIGN_IN':
    case 'SIGN_IN_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };

    case 'DEAUTH_USER':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };

    default:
      return state;
  }
};

export default reducer;
