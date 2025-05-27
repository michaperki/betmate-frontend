import { connect } from 'react-redux';

import { RootState } from 'types/state';
import {
  fetchCurrentRaffles,
  fetchRaffleHistory,
  optInToRaffle
} from 'store/actionCreators/raffleActionCreators';
import RaffleDashboard from './component';

const mapStateToProps = (state: RootState) => ({
  currentRaffles: state.raffle.currentRaffles,
  raffleHistory: state.raffle.raffleHistory,
  loading: state.raffle.loading,
  error: state.raffle.error,
  optInLoading: state.raffle.optInLoading,
  historyPagination: state.raffle.historyPagination,
});

const mapDispatchToProps = {
  fetchCurrentRaffles,
  fetchRaffleHistory,
  optInToRaffle,
};

export default connect(mapStateToProps, mapDispatchToProps)(RaffleDashboard);