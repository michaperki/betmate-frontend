import { connect } from 'react-redux';

import { errorSelector, loadingSelector } from 'store/actionCreators/requestActionCreators';
import { fetchGamesByStatus, clearGames } from 'store/actionCreators/gameActionCreators';

import { ActionTypes, RootState } from 'types/state';
import Dashboard from './component';

const loadActions: ActionTypes[] = ['FETCH_GAMES'];

const mapStateToProps = (state: RootState) => {
  const filteredGames = Object.values(state.game.games)
    .filter((game) => {
      const isActive = game.game_status === 'not_started' || game.game_status === 'in_progress';
      return isActive;
    });

  return {
    games: filteredGames,
    isLoading: loadingSelector(loadActions, state),
    errorMessage: errorSelector(loadActions, state),
    user: state.auth.user,
  };
};

export default connect(mapStateToProps, { fetchGamesByStatus, clearGames })(Dashboard);
