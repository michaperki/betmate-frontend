import { ChessgroundState } from 'types/chessground';
import { Actions } from 'types/state';
import { selectDrawshape } from 'utils/chess';

interface ExtendedChessgroundState extends ChessgroundState {
  baseAutoShapes: ChessgroundState['autoShapes'];
}

const initialState: ExtendedChessgroundState = {
  config: {
    viewOnly: true,
    highlight: {
      lastMove: true,
      check: true,
    },
    drawable: {
      enabled: true,
      visible: true,
      defaultSnapToValidMove: true,
      brushes: {
        green: {
          key: 'g',
          color: '#00ff00',
          opacity: 1.0,
          lineWidth: 12,
        },
        red: {
          key: 'r',
          color: '#ff0000',
          opacity: 1.0,
          lineWidth: 12,
        },
        blue: {
          key: 'b',
          color: '#0000ff',
          opacity: 1.0,
          lineWidth: 12,
        },
        yellow: {
          key: 'y',
          color: '#ffff00',
          opacity: 1.0,
          lineWidth: 12,
        },
      },
    },
  },
  autoShapes: [],
  baseAutoShapes: [],
  showAutoShapes: false,
  selected: undefined,
};

const chessgroundReducer = (
  state = initialState,
  action: Actions,
): ExtendedChessgroundState => {
  if (action.status !== 'SUCCESS') return state;

  switch (action.type) {
    case 'CG_NEW_MOVE':
      return {
        ...state,
        config: {
          ...state.config,
          fen: action.payload.newState,
          lastMove: action.payload.lastMove ?? [],
        },
        autoShapes: [],
        baseAutoShapes: [],
        showAutoShapes: false,
        selected: undefined,
      };

    case 'CG_NEW_ARROWS':
      return {
        ...state,
        // Only store the arrows in baseAutoShapes, but don't show them yet
        baseAutoShapes: action.payload,
        // Only set autoShapes if already showing shapes (inside the panel)
        autoShapes: state.showAutoShapes ? action.payload : [],
        // Don't automatically turn on showAutoShapes - maintain current state
        selected: undefined,
      };

    case 'CG_ENTER_MOVE_PANEL':
      return {
        ...state,
        autoShapes: state.baseAutoShapes,
        showAutoShapes: true,
      };

    case 'CG_LEAVE_MOVE_PANEL':
      return {
        ...state,
        autoShapes: [],
        showAutoShapes: false,
        selected: undefined,
      };

    case 'CG_MOVE_HOVER':
      return {
        ...state,
        selected: action.payload,
        autoShapes: selectDrawshape(state.baseAutoShapes, action.payload),
      };

    case 'CG_MOVE_UNHOVER':
      return {
        ...state,
        selected: undefined,
        autoShapes: state.showAutoShapes ? state.baseAutoShapes : [],
      };

    default:
      return state;
  }
};

export default chessgroundReducer;
