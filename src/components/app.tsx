import React, { useEffect, useMemo, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { jwtSignIn } from 'store/actionCreators/authActionCreators';
import { closeSocket } from 'store/actionCreators/websocketActionCreators';

import SignOutPanel from 'containers/authentication/signOutPanel';
import { authTokenName } from 'utils';
import OnboardingTour from './OnboardingTour';
// Terms gate overlay removed; use dedicated /terms route instead
import { ModeProvider } from 'context/ModeContext';
import { OddsFormatProvider } from 'context/OddsFormatContext';
import { ThemeProvider } from 'context/ThemeContext';
import { NotificationProvider } from './NotificationCenter/context';
import NotificationBridge from './NotificationCenter/Bridge';
import VersionFooter from 'components/VersionFooter';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import AdminRiskPage from 'containers/AdminRiskPage/component';
import AdminHome from 'containers/AdminHome/component';
import AdminWallet from 'containers/AdminWallet/component';
import AdminOps from 'containers/AdminOps/component';
import AdminKYC from 'containers/AdminKYC/component';
import AdminInvites from 'containers/AdminInvites';
import AdminEmail from 'containers/AdminEmail/component';
import Terms from 'containers/Terms';
import HowBettingWorks from 'containers/HowBettingWorks';
import FAQ from 'containers/FAQ';
// Main application pages (canonical containers)
import Dashboard from '../containers/Dashboard';
import GameContainer from '../containers/GameContainer';
import Stats from '../containers/Stats';
import MyBets from '../containers/MyBets';
import Settings from '../containers/Settings';
import Onboarding from '../containers/Onboarding';
import Login from '../containers/Login';
import EmailVerification from '../containers/EmailVerification';
import { RootState } from 'types/state';
// Examples (design references)
import BetMateMobileDashboard from '../examples/BetMateMobileDashboard';
import BetMateEmptyStates from '../examples/BetMateEmptyStates';
import BetMateThemeToggle from '../examples/BetMateThemeToggle';
import BetMateToasts from '../examples/BetMateToasts';
import HelpFAQ from './HelpFAQ';

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
  const { screenWidth } = useResponsiveLayout();
  const allowOnboarding = !delayingForAuth && screenWidth > 860; // disable guided overlay on compact screens

  // Remove boot overlay once authenticated/hydration delay is over
  useEffect(() => {
    if (!delayingForAuth) {
      try { const boot = document.getElementById('boot'); if (boot) boot.remove(); } catch {}
    }
  }, [delayingForAuth]);

  return (
    <ThemeProvider>
      <ModeProvider>
        <OddsFormatProvider>
        <NotificationProvider>
        <Router>
          <div>
            {/* Global Help modal toggled via window event */}
            <HelpController />
            {/* Terms gate moved to dedicated route; onboarding handles acceptance */}
            {/* Render onboarding only on desktop widths to avoid intrusive overlay on small screens */}
            {allowOnboarding && <OnboardingTour />}
            <NotificationBridge />
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
            <Route exact path="/signout" component={SignOutPanel} />
            <Route exact path="/onboarding" component={Onboarding} />
            <Route exact path="/verify-email/:token" component={EmailVerification} />
            {/* User settings */}
            <ProtectedRoute exact path="/user" component={Settings} />
            {/* Info pages */}
            <Route exact path="/terms" component={Terms} />
            <Route exact path="/how-betting-works" component={HowBettingWorks} />
            <Route exact path="/faq" component={FAQ} />
            {/* Wallet route removed (old UI deprecated) */}
            {/* Dev examples (design references) */}
            <Route exact path="/examples/mobile-dashboard" component={BetMateMobileDashboard} />
            <Route exact path="/examples/empty-states" component={BetMateEmptyStates} />
            <Route exact path="/examples/theme-toggle" component={BetMateThemeToggle} />
            <Route exact path="/examples/toasts" component={BetMateToasts} />
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
            <AdminRoute exact path="/admin/invites" render={() => (
                <div className="dashboard-page">
                  <AdminInvites />
                </div>
            )} />
            <AdminRoute exact path="/admin/email" render={() => (
                <div className="dashboard-page">
                  <AdminEmail />
                </div>
            )} />
            <Route component={FallBack} />
          </Switch>
            )}
            {/* Global fixed footer with Report Issue */}
            <VersionFooter />
          </div>
        </Router>
        </NotificationProvider>
        </OddsFormatProvider>
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
