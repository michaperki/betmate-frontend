import { connect } from 'react-redux';

import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById } from 'store/actionCreators/gameActionCreators';
import { RootState } from 'types/state';

import ChessMatch from './component';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.scss';

const mapStateToProps = (state: RootState) => ({
  games: state.game.games,
  showModal: state.game.showModal,
  autoShapes: state.chessground.autoShapes,
  config: state.chessground.config,
});

const mapDispatchToProps = {
  joinGame,
  leaveGame,
  fetchGameById,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChessMatch);
