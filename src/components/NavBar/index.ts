import { connect } from 'react-redux';
import { RootState } from 'types/state';

import NavBar from 'components/NavBar/component';
// Style imports moved to component.tsx

const mapStateToProps = (state: RootState) => ({
  isAuthenticated: state.auth.isAuthenticated,
  firstName: state.auth.user?.first_name,
  tokenBalance: state.auth.user?.account ?? 0,
  cashBalance: (state.auth.user as any)?.cash_balance ?? 0,
  isDarkTheme: true, // Default to dark theme
});

export default connect(mapStateToProps, {})(NavBar);
