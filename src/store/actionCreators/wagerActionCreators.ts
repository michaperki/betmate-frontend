import { Actions } from 'types/state';
import { WagerStatus } from 'types/resources/wager';

export const createWager = (
  gameId: string,
  wager: string,
  amount: number,
  wdl: boolean,
  odds: number,
  moveNumber: number,
): Actions => ({
  type: 'CREATE_WAGER',
  status: 'REQUEST',
  payload: {
    gameId, wager, amount, wdl, odds, moveNumber,
  },
});

export const fetchWagerById = (id: string): Actions => ({
  type: 'FETCH_WAGER',
  status: 'REQUEST',
  payload: { id },
});

export const fetchWagers = (): Actions => ({
  type: 'FETCH_WAGERS',
  status: 'REQUEST',
  payload: {},
});

export const fetchUserBettingStats = (): Actions => ({
  type: 'FETCH_USER_BETTING_STATS',
  status: 'REQUEST',
  payload: {},
});

export const fetchActiveWagers = (): Actions => ({
  type: 'FETCH_ACTIVE_WAGERS',
  status: 'REQUEST',
  payload: {},
});

export const fetchWagerHistory = (
  status?: WagerStatus,
  limit?: number,
  skip?: number,
): Actions => ({
  type: 'FETCH_WAGER_HISTORY',
  status: 'REQUEST',
  payload: { status, limit, skip },
});
