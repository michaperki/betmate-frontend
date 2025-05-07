import { ChessgroundState } from 'types/chessground';
import { Actions } from 'types/state';
import { fromToEqual, selectDrawshape } from 'utils/chess';

const initialState: ChessgroundState = {
  config: {
    viewOnly: true,
    highlight: { lastMove: true, check: true },
    drawable: {
      brushes: {
        green: {
          key: 'g', color: '#00ff00', opacity: 0.5, lineWidth: 10,
        },
        red: {
          key: 'r', color: '#ff0000', opacity: 0.5, lineWidth: 10,
        },
        blue: {
          key: 'b', color: '#0000ff', opacity: 0.5, lineWidth: 10,
        },
        yellow: {
          key: 'y', color: '#ffff00', opacity: 0.5, lineWidth: 10,
        },
      },
    },
  },
  autoShapes: [],
  showAutoShapes: false,
  selected: undefined,
};

const chessgroundReducer = (state = initialState, action: Actions): ChessgroundState => {
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
        selected: undefined,
      };

    case 'CG_NEW_ARROWS':
      return {
        ...state,
        autoShapes: state.showAutoShapes ? action.payload : [],
        selected: undefined,
      };

    case 'CG_ENTER_MOVE_PANEL':
      return {
        ...state,
        autoShapes: state.selected
          ? selectDrawshape(state.autoShapes, state.selected)
          : state.autoShapes,
        showAutoShapes: true,
      };

    case 'CG_LEAVE_MOVE_PANEL':
      return {
        ...state,
        autoShapes: state.selected
          ? selectDrawshape(state.autoShapes, state.selected)
          : [],
        showAutoShapes: false,
      };

    case 'CG_MOVE_HOVER':
      return {
        ...state,
        autoShapes: state.selected && !fromToEqual(state.selected, action.payload)
          ? [
            ...selectDrawshape(state.autoShapes, state.selected),
            ...selectDrawshape(state.autoShapes, action.payload),
          ]
          : selectDrawshape(state.autoShapes, action.payload),
      };

    case 'CG_MOVE_UNHOVER':
      return {
        ...state,
        autoShapes: state.selected
          ? selectDrawshape(state.autoShapes, state.selected)
          : state.autoShapes,
      };

    default:
      return state;
  }
};

export default chessgroundReducer;
