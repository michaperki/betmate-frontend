/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EventChannel } from 'redux-saga';
import {
  call, put, take, apply, select,
} from 'redux-saga/effects';

import { Socket } from 'socket.io-client';

import {
  BroadcastPoolWager, BroadcastPoolWagerActions, GameChatActions, GameUpdateActions, JoinGameData, LeaveGameData,
} from 'types/resources/game';
import { Actions, RootState } from 'types/state';
import {
  SocketErrorAction, SocketGameErrorAction,
} from 'types/socket';

import { CreateWagerActions, FetchWagersActions, WagerStatus } from 'types/resources/wager';
import { emit as emitNotification } from 'components/NotificationCenter/bus';
import { readableBet } from 'utils/wager';
import { formatAmountShort, formatNet } from 'utils/currency';
import { getBearerToken, removeBearerToken } from 'store/actionCreators';
import { User } from 'types/resources/auth';
import {
  createErrorChannel, createGameChatChannel, createUpdateGameStateChannel, createUpdateWagerStateChannel,
  createViewerCountChannel, createBetUpdateChannel,
} from './channels';

/**
 * Saga that emits 'join_game' events onto the passed socket and completes the following:
 * - Waits for an event of type 'JOIN_GAME'
 * - Emits a 'join_game' socket event using the `socket.emit` method
 * - Dispatches success or failure based on if whether an error occurred
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* joinGameHandler(socket: Socket) {
  while (true) {
    try {
      const action: { payload: JoinGameData } = yield take((a: Actions) => a.type === 'JOIN_GAME' && a.status === 'REQUEST');
      yield apply(socket, socket.emit, ['join_game', action.payload.gameId]);
      yield put<Actions>({ type: 'JOIN_GAME', status: 'SUCCESS', payload: { gameId: action.payload.gameId } });
    } catch (error) {
      yield put<Actions>({ type: 'JOIN_GAME', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that emits 'leave_game' events onto the passed socket and completes the following:
 * - Waits for an event of type 'LEAVE_GAME'
 * - Emits a 'leave_game' socket event using the `socket.emit` method
 * - Dispatches success or failure based on if whether an error occurred
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* leaveGameHandler(socket: Socket) {
  while (true) {
    try {
      const action: { payload: LeaveGameData } = yield take((a: Actions) => a.type === 'LEAVE_GAME' && a.status === 'REQUEST');
      yield apply(socket, socket.emit, ['leave_game', action.payload.gameId]);
      yield put<Actions>({ type: 'LEAVE_GAME', status: 'SUCCESS', payload: { gameId: action.payload.gameId } });
    } catch (error) {
      yield put<Actions>({ type: 'LEAVE_GAME', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that watches for events on the game-update socket channel and handles them in the following way:
 * - Waits for an event on the channel
 * - Dispatches the event to the redux store (or an error state if saga fails)
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* updateGameStateHandler(socket: Socket) {
  const socketChannel: EventChannel<GameUpdateActions> = yield call(createUpdateGameStateChannel, socket);

  while (true) {
    try {
      const action: GameUpdateActions = yield take(socketChannel);
      yield put<Actions>(action);
    } catch (error) {
      yield put<Actions>({ type: 'UPDATE_GAME_STATE', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that watches for events on the update-wagers socket channel and handles them in the following way:
 * - Waits for an event on the channel
 * - Dispatches the event to the redux store (or an error state if saga fails)
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* updateWagerStateHandler(socket: Socket) {
  const socketChannel: EventChannel<FetchWagersActions | BroadcastPoolWagerActions> = yield call(createUpdateWagerStateChannel, socket);
  // Track last known status to detect transitions
  const lastStatus = new Map<string, string>();
  while (true) {
    try {
      const action: FetchWagersActions | BroadcastPoolWagerActions = yield take(socketChannel);
      yield put<Actions>(action);
      if (action.type === 'FETCH_WAGERS') yield put<Actions>({ type: 'JWT_SIGN_IN', status: 'REQUEST', payload: { token: getBearerToken() || '' } });

      // Emit notifications for refunds and results when status flips
      try {
        if (action.type === 'FETCH_WAGERS' && action.status === 'SUCCESS') {
          const list = (action as any).payload as Array<any>;
          for (const w of list) {
            const prev = lastStatus.get(w._id);
            if (w.status === WagerStatus.CANCELLED && prev && prev !== WagerStatus.CANCELLED) {
              const readable = readableBet(!!w?.wdl, String(w?.data));
              emitNotification({ type: 'info', title: 'Bet Refunded', message: `${readable} — no winners`, icon: '↺' });
            }
            if (w.status === WagerStatus.WON && prev && prev !== WagerStatus.WON) {
              const readable = readableBet(!!w?.wdl, String(w?.data));
              const amt = Number(w?.amount || 0);
              const odds = Number(w?.odds || 0);
              const profit = Math.max(0, (amt * odds) - amt);
              const curr = (w?.currency as any) || ((w?.mode === 'real') ? 'USDT' : 'BET');
              emitNotification({ type: 'win', title: 'You Won!', message: `${formatNet(profit, curr)} on ${readable}` });
            }
            if (w.status === WagerStatus.LOST && prev && prev !== WagerStatus.LOST) {
              const readable = readableBet(!!w?.wdl, String(w?.data));
              const amt = Number(w?.amount || 0);
              const curr = (w?.currency as any) || ((w?.mode === 'real') ? 'USDT' : 'BET');
              emitNotification({ type: 'loss', title: 'Bet Lost', message: `${formatNet(-amt, curr)} on ${readable}` });
            }
            lastStatus.set(w._id, w.status);
          }
        }
      } catch {}
    } catch (error) {
      yield put<Actions>({ type: 'FETCH_WAGERS', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that watches for successful pool wagers and handles them in the following way:
 * - Waits for a successful wager action
 * - Check if it is a pool wager
 * - If so, send to websocket on 'pool_wager' channel
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* updatePoolWagerHandler(socket: Socket) {
  while (true) {
    try {
      const action: CreateWagerActions = yield take((a: Actions) => a.type === 'CREATE_WAGER' && a.status === 'SUCCESS');
      if (action.status !== 'SUCCESS') continue;
      if (action.payload.wdl) continue;

      const { game_id: gameId, data, amount } = action.payload;
      const message: BroadcastPoolWager = {
        gameId, type: 'move', data, amount,
      };
      yield apply(socket, socket.emit, ['pool_wager', message]);
      yield put<Actions>({ type: 'BROADCAST_POOL_WAGER', status: 'SUCCESS', payload: message });
    } catch (error) {
      yield put<Actions>({ type: 'BROADCAST_POOL_WAGER', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that listens for successful auth-related events and handles them in the following way:
 * - Waits for a successful auth event of type CREATE_USER, SIGN_IN_USER, or JWT_SIGN_IN
 * - Gets the saved JWT token
 * - Emits a 'join_auth' socket event using the `socket.emit` method with the JWT
 * - Dispatches success or failure based on if whether an error occurred
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* joinAuthHandler(socket: Socket) {
  const authActions = ['CREATE_USER', 'SIGN_IN_USER', 'JWT_SIGN_IN'];
  while (true) {
    try {
      yield take((a: Actions) => authActions.includes(a.type) && a.status === 'SUCCESS');
      const token = yield call(getBearerToken);
      yield apply(socket, socket.emit, ['join_auth', token]);
      yield put<Actions>({ type: 'JOIN_AUTH', status: 'SUCCESS', payload: { token } });
    } catch (error) {
      yield put<Actions>({ type: 'JOIN_AUTH', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that listens for deauth events and completes the following:
 * - Waits for an event of type 'DEAUTH_USER'
 * - Gets the saved JWT, then removes it from local storage
 * - Emits a 'leave_auth' socket event using the `socket.emit` method
 * - Dispatches success or failure based on if whether an error occurred
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* leaveAuthHandler(socket: Socket) {
  while (true) {
    try {
      yield take((a: Actions) => a.type === 'DEAUTH_USER' && a.status === 'SUCCESS');

      const token = yield call(getBearerToken);
      if (token) yield call(removeBearerToken);
      yield apply(socket, socket.emit, ['leave_auth', token]);
      yield put<Actions>({ type: 'LEAVE_AUTH', status: 'SUCCESS', payload: { token } });
    } catch (error) {
      yield put<Actions>({ type: 'LEAVE_AUTH', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

export function* sendGameMessageHandler(socket: Socket) {
  while (true) {
    try {
      const action: GameChatActions = yield take((a: Actions) => a.type === 'GAME_CHAT' && a.status === 'REQUEST');
      if (action.status !== 'REQUEST') return;
      const user: User = yield select((state: RootState) => state.auth.user);
      if (!user) throw new Error('User not authenticated');
      const message = { ...action.payload, userId: user._id, userName: user.full_name };
      yield apply(socket, socket.emit, ['game_chat', message]);
      yield put<Actions>({ type: action.type, status: 'SUCCESS', payload: message });
    } catch (error) {
      yield put<Actions>({ type: 'GAME_CHAT', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

export function* receiveGameMessageHandler(socket: Socket) {
  const socketChannel: EventChannel<GameChatActions> = yield call(createGameChatChannel, socket);

  while (true) {
    try {
      const action: GameChatActions = yield take(socketChannel);
      yield put<Actions>(action);
    } catch (error) {
      yield put<Actions>({ type: 'GAME_CHAT', status: 'FAILURE', payload: { message: error.message, code: null } });
    }
  }
}

/**
 * Saga that watches for error events on the created socketChannel and handles them in the following way:
 * - Waits for an event on the channel
 * - Dispatches the event to the redux store (or an error state if saga fails)
 * - Repeat
 * @param socket socket to watch for events on
 */
export function* errorHandler(socket: Socket) {
  const socketChannel: EventChannel<SocketErrorAction | SocketGameErrorAction> = yield call(createErrorChannel, socket);

  while (true) {
    try {
      const action: SocketErrorAction | SocketGameErrorAction = yield take(socketChannel);
      yield put<Actions>(action);
    } catch (error) {
      yield put<Actions>({ type: 'SOCKET_ERROR', status: 'FAILURE', payload: { message: error.message } });
    }
  }
}

/**
 * Saga that watches for viewer count updates on the websocket
 * @param socket socket to watch for events on
 */
export function* viewerCountHandler(socket: Socket) {
  const socketChannel: EventChannel<any> = yield call(createViewerCountChannel, socket);

  while (true) {
    try {
      const action: any = yield take(socketChannel);
      yield put({
        type: 'UPDATE_VIEWER_COUNT',
        status: 'SUCCESS',
        payload: action.payload
      });
    } catch (error) {
      // Silent error handling for viewer count updates
    }
  }
}

/**
 * Saga that watches for bet updates on the websocket to refresh game stats
 * @param socket socket to watch for events on
 */
export function* betUpdateHandler(socket: Socket) {
  const socketChannel: EventChannel<any> = yield call(createBetUpdateChannel, socket);

  while (true) {
    try {
      const action: any = yield take(socketChannel);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Bet update received:', action.payload);
      }
      // Trigger a refresh of game stats when new bets come in
      yield put({
        type: 'FETCH_GAME_STATS',
        status: 'REQUEST',
        payload: { id: action.payload.gameId }
      });
      // If backend includes an updated balance, set it immediately (skip extra fetch)
      if (action.payload && typeof action.payload.balance === 'number') {
        yield put({ type: 'SET_BALANCE', status: 'SUCCESS', payload: { balance: action.payload.balance } });
      }
    } catch (error) {
      console.error('Bet update handler error:', error);
    }
  }
}

/**
 * Saga that watches for game end events and refreshes the dashboard games list
 * @param socket socket to watch for events on
 */
export function* gameEndRefreshHandler(socket: Socket) {
  const socketChannel: EventChannel<GameUpdateActions> = yield call(createUpdateGameStateChannel, socket);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('Game end handler started - monitoring for game_over events');
  }

  while (true) {
    try {
      const action: GameUpdateActions = yield take(socketChannel);

      // When a game ends, refresh the dashboard games list
      if (action.type === 'UPDATE_GAME_END' && action.status === 'SUCCESS') {
        // Type guard to ensure we have the correct payload type
        if ('gameId' in action.payload) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('Game ended:', action.payload.gameId);
          }

          // Refresh the games list to fetch only active games
          yield put<Actions>({
            type: 'FETCH_GAMES',
            status: 'REQUEST',
            payload: { game_status: ['not_started', 'in_progress'] }
          });

          // Dispatch a custom event that components can listen for
          const gameEndEvent = new CustomEvent('game_ended', {
            detail: {
              gameId: action.payload.gameId,
              gameStatus: action.payload.game_status,
              timestamp: Date.now(),
              complete: action.payload.complete
            }
          });

          window.dispatchEvent(gameEndEvent);

          // Dispatch a second refresh after a delay as a backup
          yield new Promise(resolve => setTimeout(resolve, 1500));
          yield put<Actions>({
            type: 'FETCH_GAMES',
            status: 'REQUEST',
            payload: { game_status: ['not_started', 'in_progress'] }
          });
        } else {
          console.error('Error: UPDATE_GAME_END payload missing gameId:', action.payload);
        }
      }
    } catch (error) {
      console.error('Game end refresh handler error:', error);
    }
  }
}
