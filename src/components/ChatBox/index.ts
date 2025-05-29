import { connect } from 'react-redux';
import { RootState } from 'types/state';
import { sendGameChat } from 'store/actionCreators/gameActionCreators';

import ChatBox, { ChatBoxProps } from './component';

const mapStateToProps = (state: RootState) => ({
  chats: state.game.chats,
});

export type { ChatBoxProps };
export default connect(mapStateToProps, { sendGameChat })(ChatBox);
