import React, { useEffect, useMemo, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { jwtSignIn } from 'store/actionCreators/authActionCreators';
import { closeSocket } from 'store/actionCreators/websocketActionCreators';

import SignOutPanel from 'containers/authentication/signOutPanel';
import { authTokenName } from 'utils';
import { ModeProvider } from 'context/ModeContext';
import { ThemeProvider } from 'context/ThemeContext';
import VersionFooter from 'components/VersionFooter';
import AdminRiskPage from 'containers/AdminRiskPage/component';
import AdminHome from 'containers/AdminHome/component';
import AdminWallet from 'containers/AdminWallet/component';
import AdminOps from 'containers/AdminOps/component';
import AdminKYC from 'containers/AdminKYC/component';
import AdminEmail from 'containers/AdminEmail/component';
import AdminInvites from 'containers/AdminInvites';
import AdminUsersSearch from 'containers/AdminUsersSearch/component';
import AdminUsersLedger from 'containers/AdminUsersLedger/component';
import AdminFeatured from 'containers/AdminFeatured/component';
import AdminAudit from 'containers/AdminAudit/component';
import { RootState } from 'types/state';
import TermsGate from './TermsGate';
import { NotificationProvider } from './NotificationCenter/context';
import NotificationBridge from './NotificationCenter/Bridge';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminLayout from '../admin/layout/AdminLayout';
// Main application pages (canonical containers)
import Dashboard from '../containers/Dashboard';
import GameContainer from '../containers/GameContainer';
import Stats from '../containers/Stats';
import MyBets from '../containers/MyBets';
import Settings from '../containers/Settings';
import Onboarding from '../containers/Onboarding';
import Login from '../containers/Login';
import MagicLogin from '../containers/MagicLogin';
// Examples (design references)
import BetMateMobileDashboard from '../examples/BetMateMobileDashboard';
import BetMateEmptyStates from '../examples/BetMateEmptyStates';
import BetMateThemeToggle from '../examples/BetMateThemeToggle';
import BetMateToasts from '../examples/BetMateToasts';
import HelpFAQ from './HelpFAQ';
import OnboardingTour from './OnboardingTour';

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

  // Remove boot overlay once authenticated/hydration delay is over
  useEffect(() => {
    if (!delayingForAuth) {
      try { const boot = document.getElementById('boot'); if (boot) boot.remove(); } catch {}
    }
  }, [delayingForAuth]);

  return (
    <ThemeProvider>
      <ModeProvider>
        <NotificationProvider>
          <Router>
            <div>
              {/* Global Help modal toggled via window event */}
              <HelpController />
              {/* Terms gate modal (first-login acceptance) */}
              {isAuthenticated && <TermsGate isAuthenticated={isAuthenticated} />}
              <NotificationBridge />
              {/* Global Onboarding Tour overlay */}
              <OnboardingTour />
              {delayingForAuth ? null : (
                <Switch>
                  {/* App routes */}
                  <Route exact path="/" component={Dashboard} />
                  {/* Game UI */}
                  <Route exact path="/matches/:id" component={GameContainer} />
                  <Route exact path="/chess/featured" render={() => <GameContainer />} />
                  <Route exact path="/chess/:id" render={() => <GameContainer />} />
                  <Route exact path="/bets" component={MyBets} />
                  <Route exact path="/stats" component={Stats} />
                  {/* Auth routes */}
                  <Route exact path="/signin" component={Login} />
                  <Route exact path="/signup" component={Login} />
                  <Route exact path="/magic/:token" component={MagicLogin} />
                  <Route exact path="/signout" component={SignOutPanel} />
                  <Route exact path="/onboarding" component={Onboarding} />
                  {/* User settings */}
                  <ProtectedRoute exact path="/user" component={Settings} />
                  {/* Wallet route removed (old UI deprecated) */}
                  {/* Dev examples (design references) */}
                  <Route exact path="/examples/mobile-dashboard" component={BetMateMobileDashboard} />
                  <Route exact path="/examples/empty-states" component={BetMateEmptyStates} />
                  <Route exact path="/examples/theme-toggle" component={BetMateThemeToggle} />
                  <Route exact path="/examples/toasts" component={BetMateToasts} />
                  <AdminRoute exact path="/admin" render={() => (
                    <AdminLayout>
                      <AdminHome />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/wallet" render={() => (
                    <AdminLayout>
                      <AdminWallet />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/ops" render={() => (
                    <AdminLayout>
                      <AdminOps />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/kyc" render={() => (
                    <AdminLayout>
                      <AdminKYC />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/risk" render={() => (
                    <AdminLayout>
                      <AdminRiskPage />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/invites" render={() => (
                    <AdminLayout>
                      <AdminInvites />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/email" render={() => (
                    <AdminLayout>
                      <AdminEmail />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/users/search" render={() => (
                    <AdminLayout>
                      <AdminUsersSearch />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/users/ledger" render={() => (
                    <AdminLayout>
                      <AdminUsersLedger />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/markets/featured" render={() => (
                    <AdminLayout>
                      <AdminFeatured />
                    </AdminLayout>
                  )} />
                  <AdminRoute exact path="/admin/audit" render={() => (
                    <AdminLayout>
                      <AdminAudit />
                    </AdminLayout>
                  )} />
                  <Route component={FallBack} />
                </Switch>
              )}
              {/* Global fixed footer with Report Issue */}
              <VersionFooter />
            </div>
          </Router>
        </NotificationProvider>
      </ModeProvider>
    </ThemeProvider>
  );
};

export default connect(null, { jwtSignIn, closeSocket })(App);

// Lightweight controller component mounted at app root to toggle HelpFAQ via a window event
const HelpController: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('betmate:open-help', onOpen as any);
    return () => window.removeEventListener('betmate:open-help', onOpen as any);
  }, []);
  return <HelpFAQ isOpen={open} onClose={() => setOpen(false)} />;
};
