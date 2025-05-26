import { Actions } from 'types/state';

export const fetchGameById = (id: string): Actions => ({
  type: 'FETCH_GAME',
  status: 'REQUEST',
  payload: { id },
});

export const fetchGamesByStatus = (game_status: string[]): Actions => ({
  type: 'FETCH_GAMES',
  status: 'REQUEST',
  payload: { game_status },
});

export const updateShowModal = (gameId: string, modalState: boolean): Actions => ({
  type: 'UPDATE_SHOW_MODAL',
  status: 'SUCCESS',
  payload: { gameId, modalState },
});

export const clearGames = (): Actions => ({
  type: 'CLEAR_GAMES',
  status: 'SUCCESS',
  payload: {},
});

export const sendGameChat = (gameId: string, chat: string): Actions => ({
  type: 'GAME_CHAT',
  status: 'REQUEST',
  payload: { gameId, chat, time: new Date().toISOString() },
});

export const toggleQuickBet = (): Actions => ({
  type: 'TOGGLE_QUICK_BET',
  status: 'SUCCESS',
  payload: {},
});

export const setPendingBet = (pendingBet: {
  moveString: string;
  stake: number;
  gameId: string;
  isActive: boolean;
}): Actions => ({
  type: 'SET_PENDING_BET',
  status: 'SUCCESS',
  payload: pendingBet,
});

export const clearPendingBet = (): Actions => ({
  type: 'CLEAR_PENDING_BET',
  status: 'SUCCESS',
  payload: {},
});

export const fetchGameStats = (id: string): Actions => ({
  type: 'FETCH_GAME_STATS',
  status: 'REQUEST',
  payload: { id },
});
