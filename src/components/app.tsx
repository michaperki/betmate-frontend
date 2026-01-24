import React, { useEffect, useMemo, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { jwtSignIn } from 'store/actionCreators/authActionCreators';
import { closeSocket } from 'store/actionCreators/websocketActionCreators';

import SignOutPanel from 'containers/authentication/signOutPanel';
import { authTokenName } from 'utils';
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
// New mock-first pages
import NewDashboard from '../experimental/NewDashboard';
import NewGameContainer from '../containers/NewGameContainer';
import NewStats from '../experimental/NewStats';
import NewMyBets from '../experimental/NewMyBets';
import NewSettings from '../experimental/NewSettings';
import NewOnboarding from '../experimental/NewOnboarding';
import MockLogin from '../experimental/MockLogin';
import { RootState } from 'types/state';

const FallBack = () => {
  return <div>Uh oh... URL Not Found! Please contact the system administrator.</div>;
};

interface AppProps {
  closeSocket: typeof closeSocket,
  jwtSignIn: typeof jwtSignIn,
}

const App: React.FC<AppProps> = (props) => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);
  const hasToken = useMemo(() => {
    try { return !!localStorage.getItem(authTokenName); } catch { return false; }
  }, []);

  useEffect(() => {
    return () => { props.closeSocket(); };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(authTokenName);
    if (token) props.jwtSignIn();
  }, []);

  // Suppress guest header flicker while jwtSignIn hydrates
  useEffect(() => {
    if (hasToken && !isAuthenticated) {
      const t = window.setTimeout(() => setHydrationTimedOut(true), 1500);
      return () => window.clearTimeout(t);
    }
    setHydrationTimedOut(false);
  }, [hasToken, isAuthenticated]);

  const delayingForAuth = hasToken && !isAuthenticated && !hydrationTimedOut;

  return (
    <ThemeProvider>
      <ModeProvider>
        <Router>
          <div>
            {/* Global, non-invasive onboarding tour overlay */}
            <OnboardingTour />
            {delayingForAuth ? (
              <div aria-busy style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)' }} />
            ) : (
            <Switch>
            {/* New mock-first app routes */}
            <Route exact path="/new-dashboard" component={NewDashboard} />
            <Route exact path="/newDashboard" component={NewDashboard} />
            <Route exact path="/" component={NewDashboard} />
            <Route exact path="/new-game/:id" component={NewGameContainer} />
            <Route exact path="/matches/:id" component={NewGameContainer} />
            <Route exact path="/chess/featured" render={() => <NewGameContainer />} />
            <Route exact path="/chess/:id" render={() => <NewGameContainer />} />
            <Route exact path="/new-stats" component={NewStats} />
            <Route exact path="/new-my-bets" component={NewMyBets} />
            <Route exact path="/new-settings" component={NewSettings} />
            <Route exact path="/new-onboarding" component={NewOnboarding} />
            <Route exact path="/new-login" component={MockLogin} />
            {/* Map legacy bet pages to new My Bets */}
            <Route exact path="/active-bets" component={NewMyBets} />
            <Route exact path="/betting-history" component={NewMyBets} />
            {/* Auth routes → mock-first login */}
            <Route exact path="/signin" component={MockLogin} />
            <Route exact path="/signup" component={MockLogin} />
            <Route exact path="/signout" component={SignOutPanel} />
            {/* User settings → new settings page */}
            <ProtectedRoute exact path="/user" component={NewSettings} />
            <ProtectedRoute exact path="/wallet" render={() => (
              <div className="dashboard-page">
                <Wallet />
              </div>
            )} />
            <AdminRoute exact path="/admin" render={() => (
                <div className="dashboard-page">
                  <AdminHome />
                </div>
            )} />
            <AdminRoute exact path="/admin/wallet" render={() => (
                <div className="dashboard-page">
                  <AdminWallet />
                </div>
            )} />
            <AdminRoute exact path="/admin/ops" render={() => (
                <div className="dashboard-page">
                  <AdminOps />
                </div>
            )} />
            <AdminRoute exact path="/admin/kyc" render={() => (
                <div className="dashboard-page">
                  <AdminKYC />
                </div>
            )} />
            <AdminRoute exact path="/admin/risk" render={() => (
                <div className="dashboard-page">
                  <AdminRiskPage />
                </div>
            )} />
            <Route component={FallBack} />
          </Switch>
            )}
          </div>
        </Router>
      </ModeProvider>
    </ThemeProvider>
  );
};

export default connect(null, { jwtSignIn, closeSocket })(App);
