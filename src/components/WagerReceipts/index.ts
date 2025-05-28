import { connect } from 'react-redux';
import { RootState } from 'types/state';
import { fetchWagers } from 'store/actionCreators/wagerActionCreators';
import { useParams } from 'react-router';

import WagerReceipts, { WagerReceiptsProps } from './component';

const mapStateToProps = (state: RootState, ownProps: any) => {
  // Get gameId from router params or from ownProps
  const gameId = ownProps?.match?.params?.id;

  // Only pass game state if we have a valid gameId
  const currentGame = gameId ? state.game.games[gameId] : null;

  return {
    resolvedWagers: Object.values(state.wager.wagers),
    gameState: currentGame?.state, // Add game state to trigger updates
    moveHistory: currentGame?.move_hist, // Add move history to trigger updates
  };
};

export type { WagerReceiptsProps };
export default connect(mapStateToProps, { fetchWagers })(WagerReceipts);