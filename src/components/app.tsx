import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import {
  BrowserRouter as Router, Route, Switch,
} from 'react-router-dom';

import { jwtSignIn } from 'store/actionCreators/authActionCreators';
import { closeSocket } from 'store/actionCreators/websocketActionCreators';

import SignUpPanel from 'containers/authentication/signUpPanel';
import SignInPanel from 'containers/authentication/signInPanel';
import SignOutPanel from 'containers/authentication/signOutPanel';
import { authTokenName } from 'utils';
import UserPage from 'containers/UserPage';
import Dashboard from '../containers/Dashboard';
import ChessMatch from '../containers/ChessMatch';
import ActiveBetsPage from 'containers/ActiveBetsPage';
import BettingHistoryPage from 'containers/BettingHistoryPage';
import NavBar from './NavBar';
import RequireAuthHOC from 'hocs/requireAuth';
import VersionFooter from './VersionFooter';
import OnboardingTour from './OnboardingTour';
import { ModeProvider } from 'context/ModeContext';
import { ThemeProvider } from 'context/ThemeContext';
import Wallet from './Wallet/component';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminRiskPage from 'containers/AdminRiskPage/component';
import AdminHome from 'containers/AdminHome/component';
import AdminWallet from 'containers/AdminWallet/component';
import AdminOps from 'containers/AdminOps/component';
import AdminKYC from 'containers/AdminKYC/component';
// TestLayoutPage has replaced ChessMatch; route uses ChessMatch wrapper
import NewDashboard from '../experimental/NewDashboard';
import NewGame from '../experimental/NewGame';
import NewGameContainer from '../containers/NewGameContainer';
import { isNewGameUiEnabled } from 'utils/config';
import NewStats from '../experimental/NewStats';
import NewMyBets from '../experimental/NewMyBets';
import NewSettings from '../experimental/NewSettings';
import NewOnboarding from '../experimental/NewOnboarding';
import MockLogin from '../experimental/MockLogin';

const Welcome = () => {
  return (
    <div className="dashboard-page">
      <NavBar />
      <Dashboard/>
      <VersionFooter />
    </div>
  );
};

const FallBack = () => {
  return <div>Uh oh... URL Not Found! Please contact the system administrator.</div>;
};

interface AppProps {
  closeSocket: typeof closeSocket,
  jwtSignIn: typeof jwtSignIn,
}

const App: React.FC<AppProps> = (props) => {
  useEffect(() => {
    return () => { props.closeSocket(); };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(authTokenName);
    if (token) props.jwtSignIn();
  }, []);

  return (
    <ThemeProvider>
      <ModeProvider>
        <Router>
          <div>
            {/* Global, non-invasive onboarding tour overlay */}
            <OnboardingTour />
            <Switch>
            {/* Experimental new dashboard mockup — full-bleed standalone page */}
            <Route exact path="/new-dashboard" component={NewDashboard} />
            <Route exact path="/newDashboard" component={NewDashboard} />
            <Route exact path="/new-game/:id" component={NewGameContainer} />
            <Route exact path="/new-stats" component={NewStats} />
            <Route exact path="/new-my-bets" component={NewMyBets} />
            <Route exact path="/new-settings" component={NewSettings} />
            <Route exact path="/new-onboarding" component={NewOnboarding} />
            <Route exact path="/new-login" component={MockLogin} />
            <Route exact path="/" component={Welcome} />
            <Route exact path="/matches/:id" component={Welcome} />
            <Route exact path="/chess/featured" render={() => <NewGameContainer />} />
            <Route
              exact
              path="/chess/:id"
              render={() => (isNewGameUiEnabled() ? <NewGameContainer /> : <ChessMatch />)}
            />
            {/* Raffles route removed */}
            <ProtectedRoute exact path="/active-bets" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <ActiveBetsPage />
                  <VersionFooter />
                </div>
            )} />
            <ProtectedRoute exact path="/betting-history" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <BettingHistoryPage />
                  <VersionFooter />
                </div>
            )} />
            <Route exact path="/signin" component={SignInPanel} />
            <Route exact path="/signup" component={SignUpPanel} />
            <Route exact path="/signout" component={SignOutPanel} />
            <ProtectedRoute exact path="/user" component={UserPage} />
            <ProtectedRoute exact path="/wallet" render={() => (
              <div className="dashboard-page">
                <Wallet />
              </div>
            )} />
            <AdminRoute exact path="/admin" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <AdminHome />
                  <VersionFooter />
                </div>
            )} />
            <AdminRoute exact path="/admin/wallet" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <AdminWallet />
                  <VersionFooter />
                </div>
            )} />
            <AdminRoute exact path="/admin/ops" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <AdminOps />
                  <VersionFooter />
                </div>
            )} />
            <AdminRoute exact path="/admin/kyc" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <AdminKYC />
                  <VersionFooter />
                </div>
            )} />
            <AdminRoute exact path="/admin/risk" render={() => (
                <div className="dashboard-page">
                  <NavBar />
                  <AdminRiskPage />
                  <VersionFooter />
                </div>
            )} />
            <Route component={FallBack} />
          </Switch>
          </div>
        </Router>
      </ModeProvider>
    </ThemeProvider>
  );
};

export default connect(null, { jwtSignIn, closeSocket })(App);
