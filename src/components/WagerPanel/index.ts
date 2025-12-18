import { connect } from 'react-redux';
import { RootState } from 'types/state';

import WagerPanel from 'components/WagerPanel/component';
import './style.scss';

const mapStateToProps = (state: RootState) => ({
  isAuthenticated: state.auth.isAuthenticated,
  tokenBalance: state.auth.user?.token_balance ?? 0,
  cashBalance: (state.auth.user as any)?.cash_balance ?? 0,
  games: state.game.games,
});

export default connect(mapStateToProps, {})(WagerPanel);
