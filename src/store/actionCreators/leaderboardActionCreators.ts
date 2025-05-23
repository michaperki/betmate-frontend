import { Actions } from 'types/state';
import { FetchGameLeaderboardActions, FETCH_GAME_LEADERBOARD } from 'types/leaderboard';

export const onLeaderboardScroll = (position: number): Actions => ({
  type: 'ON_LEADERBOARD_SCROLL',
  status: 'SUCCESS',
  payload: { position },
});

export const getLeaderboardHead = (): Actions => ({
  type: 'FETCH_LEADERBOARD_HEAD',
  status: 'REQUEST',
  payload: {},
});

export const extendLeaderboardTop = (rowSize: number): Actions => ({
  type: 'EXTEND_LEADERBOARD_TOP',
  status: 'REQUEST',
  payload: { rowSize },
});

export const extendLeaderboardBottom = (): Actions => ({
  type: 'EXTEND_LEADERBOARD_BOTTOM',
  status: 'REQUEST',
  payload: {},
});

export const getUserRank = (): Actions => ({
  type: 'FETCH_USER_RANK',
  status: 'REQUEST',
  payload: {},
});

export const goToUserPosition = (rowSize: number): Actions => ({
  type: 'GOTO_USER_POSITION',
  status: 'REQUEST',
  payload: { rowSize },
});

export const leaveUserPosition = (): Actions => ({
  type: 'LEAVE_USER_POSITION',
  status: 'SUCCESS',
  payload: {},
});

export const getGameLeaderboard = (gameId: string): FetchGameLeaderboardActions => ({
  type: FETCH_GAME_LEADERBOARD,
  status: 'REQUEST',
  payload: { gameId },
});
