import { Actions } from 'types/state';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface SocketState {
  connectionState: ConnectionState;
  reconnectAttempt: number;
  error: string | null;
  lastConnected: number | null;
  lastDisconnected: number | null;
  messageQueue: Array<{ event: string, payload: any }>;
}

const initialState: SocketState = {
  connectionState: 'disconnected',
  reconnectAttempt: 0,
  error: null,
  lastConnected: null,
  lastDisconnected: null,
  messageQueue: [],
};

const socketReducer = (state = initialState, action: Actions): SocketState => {
  switch (action.type) {
    case 'INITIALIZE_SOCKET':
      if (action.status === 'REQUEST') {
        return {
          ...state,
          connectionState: 'connecting',
          error: null,
        };
      } else if (action.status === 'SUCCESS') {
        return {
          ...state,
          connectionState: 'connected',
          error: null,
          reconnectAttempt: 0,
          lastConnected: Date.now(),
        };
      } else if (action.status === 'FAILURE') {
        return {
          ...state,
          connectionState: 'error',
          error: 'Failed to connect',
        };
      }
      return state;

    case 'SOCKET_CONNECTION_STATE':
      if (action.payload.state === 'connected') {
        return {
          ...state,
          connectionState: 'connected',
          error: null,
          lastConnected: Date.now(),
          // Clear message queue on successful connection
          messageQueue: [],
        };
      } else if (action.payload.state === 'disconnected') {
        return {
          ...state,
          connectionState: 'disconnected',
          lastDisconnected: Date.now(),
        };
      } else if (action.payload.state === 'error') {
        return {
          ...state,
          connectionState: 'error',
          error: action.payload.error || 'Unknown error',
        };
      }
      return state;

    case 'SOCKET_RECONNECTING':
      return {
        ...state,
        connectionState: 'reconnecting',
        reconnectAttempt: action.payload.attempt,
      };

    case 'SOCKET_RECONNECTED':
      return {
        ...state,
        connectionState: 'connected',
        error: null,
        lastConnected: Date.now(),
      };

    case 'SOCKET_RECONNECT_FAILED':
      return {
        ...state,
        connectionState: 'error',
        error: `Failed to reconnect after ${action.payload.maxAttempts} attempts`,
      };

    case 'QUEUE_SOCKET_MESSAGE':
      return {
        ...state,
        messageQueue: [...state.messageQueue, {
          event: action.payload.event,
          payload: action.payload.payload,
        }],
      };

    case 'CLEAR_SOCKET_QUEUE':
      return {
        ...state,
        messageQueue: [],
      };

    default:
      return state;
  }
};

export default socketReducer;
