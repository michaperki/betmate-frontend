import { connect } from 'react-redux';

import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById } from 'store/actionCreators/gameActionCreators';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import {
  onEnterMovePanel,
  onLeaveMovePanel,
  onMoveHover,
  onMoveUnhover,
} from 'store/actionCreators/chessgroundActionCreators';
import { RootState } from 'types/state';

import ChessMatch from './component';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

const mapStateToProps = (state: RootState) => ({
  games: state.game.games,
  showModal: state.game.showModal,
  autoShapes: state.chessground.autoShapes,
  showAutoShapes: state.chessground.showAutoShapes,
  config: state.chessground.config,
  isAuthenticated: state.auth.isAuthenticated,
  balance: state.auth.user?.account,
  rankings: state.leaderboard.rankings,
});

const mapDispatchToProps = {
  joinGame,
  leaveGame,
  fetchGameById,
  createWager,
  onEnterMovePanel,
  onLeaveMovePanel,
  onMoveHover,
  onMoveUnhover,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChessMatch);
