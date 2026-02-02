import {
  AuthState,
  GET_BALANCE_HISTORY,
  ADJUST_BALANCE,
  SET_BALANCE,
  CHECK_EMAIL_VERIFICATION_STATUS,
  VERIFY_EMAIL,
  RESEND_VERIFICATION_EMAIL
} from 'types/resources/auth';
import { Actions } from 'types/state';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  balanceHistory: [],
  loadingBalanceHistory: false,
  balanceHistoryError: null,
  emailVerificationStatus: null,
  verificationStatus: null,
  verificationError: null,
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

  // Handle CHECK_EMAIL_VERIFICATION_STATUS action
  if (action.type === CHECK_EMAIL_VERIFICATION_STATUS) {
    switch (action.status) {
      case 'SUCCESS':
        return {
          ...state,
          emailVerificationStatus: {
            verified: action.payload.verified,
            required: action.payload.required,
          },
        };

      case 'FAILURE':
        // Don't update state on failure
        return state;
    }
  }

  // Handle VERIFY_EMAIL action
  if (action.type === VERIFY_EMAIL) {
    switch (action.status) {
      case 'REQUEST':
        return {
          ...state,
          verificationStatus: 'pending',
          verificationError: null,
        };

      case 'SUCCESS':
        // If backend returned a user snapshot, prefer that; otherwise safely update existing user if present
        {
          const payload: any = action.payload || {};
          const nextUser = payload.user || (state.user ? { ...state.user, email_verified: true } : state.user);
          return {
            ...state,
            verificationStatus: 'verified',
            verificationError: null,
            user: nextUser,
            emailVerificationStatus: state.emailVerificationStatus ? {
              ...state.emailVerificationStatus,
              verified: true,
            } : {
              verified: true,
              required: false
            },
          };
        }

      case 'FAILURE':
        return {
          ...state,
          verificationStatus: 'failed',
          verificationError: action.payload.message || 'Verification failed',
        };
    }
  }

  // Handle RESEND_VERIFICATION_EMAIL action
  if (action.type === RESEND_VERIFICATION_EMAIL) {
    switch (action.status) {
      case 'REQUEST':
        return state;

      case 'SUCCESS':
        // No state changes needed on success
        return state;

      case 'FAILURE':
        // No state changes needed on failure
        return state;
    }
  }
  
  // Only process the rest of the cases if action.status is SUCCESS
  if (action.status !== 'SUCCESS') return state;
  
  switch (action.type) {
    case ADJUST_BALANCE: {
      if (!state.user) return state;
      const delta = Number(action.payload?.delta || 0);
      const nextToken = Math.max(0, (state.user.token_balance || 0) + delta);
      return {
        ...state,
        user: {
          ...state.user,
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
