import {
  SOCKET_CONNECTION_STATE,
  SOCKET_RECONNECTING,
  SOCKET_RECONNECTED,
  SOCKET_RECONNECT_FAILED,
  QUEUE_SOCKET_MESSAGE,
  CLEAR_SOCKET_QUEUE,
  SocketConnectionStateData,
  SocketReconnectingData,
  SocketReconnectedData,
  SocketReconnectFailedData,
  QueueSocketMessageData,
} from 'types/socket';

import { Action } from 'types/state';

export const updateSocketConnectionState = (connectionState: SocketConnectionStateData): Action<typeof SOCKET_CONNECTION_STATE, SocketConnectionStateData> => ({
  type: SOCKET_CONNECTION_STATE,
  status: connectionState.state === 'connected' ? 'SUCCESS' : 'REQUEST',
  payload: connectionState,
});

export const socketReconnecting = (data: SocketReconnectingData): Action<typeof SOCKET_RECONNECTING, SocketReconnectingData> => ({
  type: SOCKET_RECONNECTING,
  status: 'REQUEST',
  payload: data,
});

export const socketReconnected = (data: SocketReconnectedData): Action<typeof SOCKET_RECONNECTED, SocketReconnectedData> => ({
  type: SOCKET_RECONNECTED,
  status: 'SUCCESS',
  payload: data,
});

export const socketReconnectFailed = (data: SocketReconnectFailedData): Action<typeof SOCKET_RECONNECT_FAILED, SocketReconnectFailedData> => ({
  type: SOCKET_RECONNECT_FAILED,
  status: 'FAILURE',
  payload: data,
});

export const queueSocketMessage = (event: string, payload: any): Action<typeof QUEUE_SOCKET_MESSAGE, QueueSocketMessageData> => ({
  type: QUEUE_SOCKET_MESSAGE,
  status: 'REQUEST',
  payload: { event, payload },
});

export const clearSocketQueue = (): Action<typeof CLEAR_SOCKET_QUEUE, {}> => ({
  type: CLEAR_SOCKET_QUEUE,
  status: 'SUCCESS',
  payload: {},
});
