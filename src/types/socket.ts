/* eslint-disable import/no-cycle */
import { EventChannel } from 'redux-saga';
import { Socket } from 'socket.io-client';

import { Empty } from 'types';
import { Action, AsyncAction } from 'types/state';

export type ClientEvents =
    'join_game' | 'leave_game' | 'join_auth' | 'leave_auth' | 'pool_wager' | 'game_chat';
export type ServerEvents =
    'start_game' | 'new_odds' | 'new_move' | 'game_over' | 'wager_result' | 'pool_wager' |
    'game_chat' | 'socket_error' | 'game_error' | 'viewer_count_update' | 'bet_update';
export type Events = ClientEvents | ServerEvents;

export type ChannelCreator<T extends {} = {}> = (socket: Socket) => EventChannel<T>;

/* -------- State -------- */

/* -------- Action Types -------- */

export const INITIALIZE_SOCKET = 'INITIALIZE_SOCKET';
export const CLOSE_SOCKET = 'CLOSE_SOCKET';
export const SOCKET_ERROR = 'SOCKET_ERROR';
export const SOCKET_GAME_ERROR = 'SOCKET_GAME_ERROR';
export const JOIN_AUTH = 'JOIN_AUTH';
export const LEAVE_AUTH = 'LEAVE_AUTH';
export const SOCKET_CONNECTION_STATE = 'SOCKET_CONNECTION_STATE';
export const SOCKET_RECONNECTING = 'SOCKET_RECONNECTING';
export const SOCKET_RECONNECTED = 'SOCKET_RECONNECTED';
export const SOCKET_RECONNECT_FAILED = 'SOCKET_RECONNECT_FAILED';
export const QUEUE_SOCKET_MESSAGE = 'QUEUE_SOCKET_MESSAGE';
export const CLEAR_SOCKET_QUEUE = 'CLEAR_SOCKET_QUEUE';

export type InitializeSocketData = { url: string };
export type SocketErrorData = { message: string };
export type SocketGameErrorData = { gameId: string, message: string };
export type CloseSocketData = Empty;
export type JoinAuthData = { token: string };
export type LeaveAuthData = { token: string };
export type SocketConnectionStateData = {
  state: 'disconnected' | 'connecting' | 'connected' | 'error',
  reason?: string,
  error?: string
};
export type SocketReconnectingData = { attempt: number, delay: number };
export type SocketReconnectedData = { attempts: number };
export type SocketReconnectFailedData = { maxAttempts: number };
export type QueueSocketMessageData = { event: string, payload: any };
export type ClearSocketQueueData = Empty;

export type InitializeSocketAction = Action<typeof INITIALIZE_SOCKET, InitializeSocketData>;
export type SocketErrorAction = Action<typeof SOCKET_ERROR, SocketErrorData>;
export type SocketGameErrorAction = Action<typeof SOCKET_GAME_ERROR, SocketGameErrorData>;
export type CloseSocketAction = Action<typeof CLOSE_SOCKET, CloseSocketData>;
export type JoinAuthActions = AsyncAction<typeof JOIN_AUTH, JoinAuthData, JoinAuthData>;
export type LeaveAuthActions = AsyncAction<typeof LEAVE_AUTH, LeaveAuthData, LeaveAuthData>;
export type SocketConnectionStateAction = Action<typeof SOCKET_CONNECTION_STATE, SocketConnectionStateData>;
export type SocketReconnectingAction = Action<typeof SOCKET_RECONNECTING, SocketReconnectingData>;
export type SocketReconnectedAction = Action<typeof SOCKET_RECONNECTED, SocketReconnectedData>;
export type SocketReconnectFailedAction = Action<typeof SOCKET_RECONNECT_FAILED, SocketReconnectFailedData>;
export type QueueSocketMessageAction = Action<typeof QUEUE_SOCKET_MESSAGE, QueueSocketMessageData>;
export type ClearSocketQueueAction = Action<typeof CLEAR_SOCKET_QUEUE, ClearSocketQueueData>;

export type SocketActions =
  InitializeSocketAction |
  SocketErrorAction |
  SocketGameErrorAction |
  CloseSocketAction |
  JoinAuthActions |
  LeaveAuthActions |
  SocketConnectionStateAction |
  SocketReconnectingAction |
  SocketReconnectedAction |
  SocketReconnectFailedAction |
  QueueSocketMessageAction |
  ClearSocketQueueAction;

export type SocketActionTypes =
  typeof INITIALIZE_SOCKET |
  typeof SOCKET_ERROR |
  typeof SOCKET_GAME_ERROR |
  typeof CLOSE_SOCKET |
  typeof JOIN_AUTH |
  typeof LEAVE_AUTH |
  typeof SOCKET_CONNECTION_STATE |
  typeof SOCKET_RECONNECTING |
  typeof SOCKET_RECONNECTED |
  typeof SOCKET_RECONNECT_FAILED |
  typeof QUEUE_SOCKET_MESSAGE |
  typeof CLEAR_SOCKET_QUEUE;
