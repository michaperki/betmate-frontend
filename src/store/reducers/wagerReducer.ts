import { WagerState, WagerStatus, Wager } from 'types/resources/wager';
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

      case 'FETCH_WAGERS': {
        // Merge into dictionary for quick lookups
        const mergedDict = action.payload.reduce((accum, wager) => ({
          ...accum,
          [wager._id]: wager,
        }), state.wagers);

        // Also reconcile list views (active vs history) so UIs that rely on them update in realtime
        const incomingById = new Map<string, Wager>(action.payload.map(w => [w._id, w]));

        // Active: keep pending only; update existing; add new pending from incoming
        const nextActive: Wager[] = [];
        const seenActive = new Set<string>();
        // Update current actives first
        for (const w of state.activeWagers) {
          const upd = incomingById.get(w._id);
          if (upd) {
            if (upd.status === WagerStatus.PENDING) {
              nextActive.push(upd);
              seenActive.add(upd._id);
            }
            // if not pending, drop from active
          } else {
            // no update for this one; keep as-is
            if (w.status === WagerStatus.PENDING) {
              nextActive.push(w);
              seenActive.add(w._id);
            }
          }
        }
        // Add any new pending not in current list
        for (const w of action.payload) {
          if (w.status === WagerStatus.PENDING && !seenActive.has(w._id)) {
            nextActive.push(w);
          }
        }

        // History: keep non-pending; update existing; add new resolved from incoming
        const nextHistoryById = new Map<string, Wager>();
        // Seed with existing history
        for (const w of state.wagerHistory) nextHistoryById.set(w._id, w);
        // Apply updates
        for (const w of action.payload) {
          if (w.status !== WagerStatus.PENDING) {
            nextHistoryById.set(w._id, w);
          } else {
            // ensure pending ones are not kept in history map
            nextHistoryById.delete(w._id);
          }
        }
        // Preserve order: most recent first by updated_at/created_at if present, else as-is
        const nextHistory = Array.from(nextHistoryById.values()).sort((a, b) => {
          const ta = Date.parse(a.updated_at || a.created_at || '');
          const tb = Date.parse(b.updated_at || b.created_at || '');
          return isNaN(tb - ta) ? 0 : (tb - ta);
        });

        return {
          ...state,
          wagers: mergedDict,
          activeWagers: nextActive,
          wagerHistory: nextHistory,
        };
      }

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
