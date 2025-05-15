import { connect } from 'react-redux';
import { createWager } from 'store/actionCreators/wagerActionCreators';

import { RootState } from 'types/state';
import { updateShowModal } from '../../store/actionCreators/gameActionCreators';

import PregameModal from './component';
// Style imports are now in component.tsx

const mapStateToProps = (state: RootState) => ({
  games: state.game.games,
  isAuthenticated: state.auth.isAuthenticated,
  isDarkTheme: true, // Default to dark theme
});

export default connect(mapStateToProps, { updateShowModal, createWager })(PregameModal);
