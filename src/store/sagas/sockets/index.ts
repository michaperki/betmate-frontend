/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  call, take, fork, cancel, put, delay, race,
} from 'redux-saga/effects';

import { io, Socket } from 'socket.io-client';

import { Actions } from 'types/state';
import { ROOT_URL } from 'utils';

import {
  errorHandler,
  joinAuthHandler,
  joinGameHandler,
  leaveAuthHandler,
  leaveGameHandler,
  receiveGameMessageHandler,
  sendGameMessageHandler,
  updateGameStateHandler,
  updatePoolWagerHandler,
  updateWagerStateHandler,
  viewerCountHandler,
  betUpdateHandler,
  gameEndRefreshHandler,
} from './handlers';

const WS_URL = `${ROOT_URL}/chessws`;

// Constants for reconnection strategy
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

/**
 * Function that creates and returns a websocket instance with reconnection options
 * @param address WS url to connect to
 * @returns websocket instance
 */
const createSocket = (address: string) => io(address, {
  reconnection: true,
  reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  reconnectionDelay: INITIAL_RECONNECT_DELAY,
  reconnectionDelayMax: MAX_RECONNECT_DELAY,
  timeout: 20000,
  autoConnect: true,
  // Prefer WebSocket to avoid long-poll cycles that trigger rate limits
  transports: ['websocket'],
});

/**
 * Helper function to create a message queue for offline operations
 */
function createMessageQueue() {
  const queue: Array<{ event: string, payload: any }> = [];

  // Create a wrapper with methods that operate on the array
  const queueWrapper = {
    enqueue: (event: string, payload: any) => {
      queue.push({ event, payload });
    },
    dequeue: () => queue.shift(),
    isEmpty: () => queue.length === 0,
    size: () => queue.length,
    flush: (socket: Socket) => {
      while (queue.length > 0) {
        const message = queue.shift();
        if (message) {
          socket.emit(message.event, message.payload);
        }
      }
    },
  };

  return queueWrapper;
}

/**
 * Function to implement the exponential backoff reconnection strategy
 */
function* reconnectWithBackoff() {
  let attempts = 0;

  while (attempts < MAX_RECONNECT_ATTEMPTS) {
    // Calculate delay with exponential backoff (2^attempt * initial_delay)
    const backoffDelay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, attempts),
      MAX_RECONNECT_DELAY,
    );

    // Add jitter to prevent all clients from reconnecting simultaneously
    const jitteredDelay = backoffDelay * (0.8 + Math.random() * 0.4); // ±20% jitter

    // Notify about reconnection attempt
    yield put<Actions>({
      type: 'SOCKET_RECONNECTING',
      status: 'REQUEST',
      payload: { attempt: attempts + 1, delay: jitteredDelay },
    });

    // Wait for the calculated delay
    yield delay(jitteredDelay);

    // Try to reconnect
    yield put<Actions>({ type: 'INITIALIZE_SOCKET', status: 'REQUEST', payload: { url: `${ROOT_URL}/chessws` } });

    // Wait for either success or failure
    const { success } = yield race({
      success: take((a: Actions) => a.type === 'INITIALIZE_SOCKET' && a.status === 'SUCCESS'),
      failure: take((a: Actions) => a.type === 'INITIALIZE_SOCKET' && a.status === 'FAILURE'),
    });

    if (success) {
      // Successfully reconnected
      yield put<Actions>({
        type: 'SOCKET_RECONNECTED',
        status: 'SUCCESS',
        payload: { attempts: attempts + 1 },
      });
      return true;
    }

    attempts++;
  }

  // Max attempts reached
  yield put<Actions>({
    type: 'SOCKET_RECONNECT_FAILED',
    status: 'FAILURE',
    payload: { maxAttempts: MAX_RECONNECT_ATTEMPTS },
  });

  return false;
}

/**
 * Saga that manages WebSocket connections with reliable reconnection strategy:
 * - Wait for an action of type 'INITIALIZE_SOCKET'
 * - Create a socket connection with reconnection options
 * - Start individual event channels to handle specific socket events
 * - Implements heartbeat mechanism to detect silent disconnections
 * - Implements exponential backoff for reconnection attempts
 * - Maintains a message queue for offline operations
 */
function* watchSockets() {
  try {
    while (true) {
      // Initialize connection state in Redux
      yield put<Actions>({ type: 'SOCKET_CONNECTION_STATE', status: 'REQUEST', payload: { state: 'connecting' } });

      // Create socket with reconnection options
      const socket: Socket = yield call(createSocket, WS_URL);

      // Create message queue for offline operations
      const messageQueue = createMessageQueue();

      // Setup socket event handlers
      socket.on('connect', () => {
        // Dispatch connection state
        put<Actions>({
          type: 'SOCKET_CONNECTION_STATE',
          status: 'SUCCESS',
          payload: { state: 'connected' },
        });

        // Process any queued messages
        messageQueue.flush(socket);
      });

      socket.on('disconnect', (reason) => {
        put<Actions>({
          type: 'SOCKET_CONNECTION_STATE',
          status: 'FAILURE',
          payload: { state: 'disconnected', reason },
        });

        // If the disconnection was intentional, don't reconnect
        if (reason === 'io client disconnect') {
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        put<Actions>({
          type: 'SOCKET_CONNECTION_STATE',
          status: 'FAILURE',
          payload: { state: 'error', error: error.message },
        });
      });

      // Setup heartbeat to detect silent disconnections
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('heartbeat');
        }
      }, 30000); // 30 second heartbeat

      // Notify about successful connection
      yield put<Actions>({ type: 'INITIALIZE_SOCKET', status: 'SUCCESS', payload: { url: WS_URL } });

      // Open all forked processes
      const joinGameHandlerFork = yield fork(joinGameHandler, socket);
      const leaveGameHandlerFork = yield fork(leaveGameHandler, socket);
      const joinAuthHandlerFork = yield fork(joinAuthHandler, socket);
      const leaveAuthHandlerFork = yield fork(leaveAuthHandler, socket);
      const updateGameStateHandlerFork = yield fork(updateGameStateHandler, socket);
      const updateWagerStateHandlerFork = yield fork(updateWagerStateHandler, socket);
      const updatePoolWagerHandlerFork = yield fork(updatePoolWagerHandler, socket);
      const sendGameChatHandlerFork = yield fork(sendGameMessageHandler, socket);
      const receiveGameChatHandlerFork = yield fork(receiveGameMessageHandler, socket);
      const viewerCountHandlerFork = yield fork(viewerCountHandler, socket);
      const betUpdateHandlerFork = yield fork(betUpdateHandler, socket);
      const gameEndRefreshHandlerFork = yield fork(gameEndRefreshHandler, socket);
      const errorHandlerFork = yield fork(errorHandler, socket);

      // Wait for a close socket action or disconnection that requires handling
      const action = yield take((a: Actions) => a.type === 'CLOSE_SOCKET' || a.type === 'SOCKET_CONNECTION_STATE' && a.payload.state === 'disconnected');

      // Clean up heartbeat
      clearInterval(heartbeatInterval);

      // Close all forked processes
      yield cancel(joinGameHandlerFork);
      yield cancel(leaveGameHandlerFork);
      yield cancel(joinAuthHandlerFork);
      yield cancel(leaveAuthHandlerFork);
      yield cancel(updateGameStateHandlerFork);
      yield cancel(updateWagerStateHandlerFork);
      yield cancel(updatePoolWagerHandlerFork);
      yield cancel(sendGameChatHandlerFork);
      yield cancel(receiveGameChatHandlerFork);
      yield cancel(viewerCountHandlerFork);
      yield cancel(betUpdateHandlerFork);
      yield cancel(gameEndRefreshHandlerFork);
      yield cancel(errorHandlerFork);

      // Check if we need to attempt reconnection (not manual disconnection)
      if (action.type === 'SOCKET_CONNECTION_STATE' && action.payload.reason !== 'io client disconnect') {
        // Try to reconnect with exponential backoff
        const reconnected = yield call(reconnectWithBackoff);

        if (!reconnected) {
          // If reconnection fails, wait for manual retry
          yield take((a: Actions) => a.type === 'INITIALIZE_SOCKET' && a.status === 'REQUEST');
        }
      } else {
        // Manual disconnection - wait for explicit reconnection request
        yield take((a: Actions) => a.type === 'INITIALIZE_SOCKET' && a.status === 'REQUEST');
      }
    }
  } catch (error) {
    console.error('WebSocket saga error:', error);
    yield put<Actions>({
      type: 'SOCKET_CONNECTION_STATE',
      status: 'FAILURE',
      payload: { state: 'error', error: error.message },
    });
  }
}

export default watchSockets;
