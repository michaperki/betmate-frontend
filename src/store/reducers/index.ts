import { combineReducers } from 'redux';

import authReducer from 'store/reducers/authReducer';
import chessgroundReducer from 'store/reducers/chessgroundReducer';
import gameReducer from 'store/reducers/gameReducer';
import leaderboardReducer from 'store/reducers/leaderboardReducer';
import requestReducer from 'store/reducers/requestReducer';
import raffleReducer from 'store/reducers/raffleReducer';
import wagerReducer from 'store/reducers/wagerReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  chessground: chessgroundReducer,
  game: gameReducer,
  leaderboard: leaderboardReducer,
  requests: requestReducer,
  raffle: raffleReducer,
  wager: wagerReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
