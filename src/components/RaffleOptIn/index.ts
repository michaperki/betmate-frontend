import { connect } from 'react-redux';

import { RootState } from 'types/state';
import {
  fetchCurrentRaffles,
  optInToRaffle
} from 'store/actionCreators/raffleActionCreators';
import RaffleOptIn from './component';

const mapStateToProps = (state: RootState) => ({
  currentRaffles: state.raffle.currentRaffles,
  loading: state.raffle.loading,
  error: state.raffle.error,
  optInLoading: state.raffle.optInLoading,
  tokenBalance: state.auth.user?.account || 0,
});

const mapDispatchToProps = {
  fetchCurrentRaffles,
  optInToRaffle,
};

export default connect(mapStateToProps, mapDispatchToProps)(RaffleOptIn);