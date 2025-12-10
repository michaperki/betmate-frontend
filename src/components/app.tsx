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
import { ModeProvider } from 'context/ModeContext';
import Wallet from './Wallet/component';
import ProtectedRoute from './ProtectedRoute';

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
    <ModeProvider>
      <Router>
        <div>
          <Switch>
            <Route exact path="/" component={Welcome} />
            <Route exact path="/chess/:id" component={ChessMatch} />
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
            <Route component={FallBack} />
          </Switch>
        </div>
      </Router>
    </ModeProvider>
  );
};

export default connect(null, { jwtSignIn, closeSocket })(App);
