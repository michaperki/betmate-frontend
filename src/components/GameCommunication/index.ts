import { connect } from 'react-redux';
import { RootState } from 'types/state';
import { fetchWagers } from 'store/actionCreators/wagerActionCreators';
import { sendGameChat } from 'store/actionCreators/gameActionCreators';

import GameCommunication from './component';

const mapStateToProps = (state: RootState) => ({
  resolvedWagers: Object.values(state.wager.wagers),
  chats: state.game.chats,
});

// Include both action creators in the props
export default connect(mapStateToProps, {
  fetchWagers,
  sendGameChat
})(GameCommunication);