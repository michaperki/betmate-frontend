import React, { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import CoinBalance from '../CoinBalance';
import SignOutPanel from 'containers/authentication/signOutPanel';
import './unified-navbar.scss';
import VersionTag from '../VersionTag';
import { useMode } from 'context/ModeContext';
import ThemeToggle from '../ThemeToggle';

export interface NavBarProps {
  isAuthenticated: boolean;
  firstName: string;
  tokenBalance?: number;
  cashBalance?: number;
  role?: string;
  compact?: boolean; // Whether to use the compact variant (for game screens)
  breadcrumb?: string; // Optional context label (currently used for non-game routes only)
}

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated, firstName, tokenBalance, cashBalance, role, compact = false, breadcrumb }) => {
  const location = useLocation();
  const { mode, toggleMode, realEnabled } = useMode();
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<number | null>(null);

  // Don't show balance on dashboard since it's displayed in HeroSection
  const isDashboard = location.pathname === '/';
  const showBalance = !isDashboard;

  const handleToggleClick = () => {
    // two-click confirmation: first click arms, second within 1.5s toggles
    if (!armed) {
      setArmed(true);
      if (armTimer.current) window.clearTimeout(armTimer.current);
      armTimer.current = window.setTimeout(() => setArmed(false), 1500);
      return;
    }
    setArmed(false);
    if (armTimer.current) window.clearTimeout(armTimer.current);
    toggleMode();
  };

  const isGameRoute = location.pathname.startsWith('/chess');

  return (
    <nav className={`navbar ${compact ? 'navbar--compact' : ''}`}>
      <div className="navbar__container">
        <NavLink to="/" className="navbar__brand">
          <img src={logo} alt="BetMate Logo" />
          <span>BetMate</span>
        </NavLink>

        {/* Mobile-friendly navigation menu */}
        <div className="navbar__menu">
          {isAuthenticated && (
            <NavLink
              to="/wallet"
              exact
              activeClassName="active"
              className="navbar__item"
            >
              Wallet
            </NavLink>
          )}
          {isAuthenticated && role === 'admin' && (
            <NavLink
              to="/admin"
              exact
              activeClassName="active"
              className="navbar__item"
            >
              Admin
            </NavLink>
          )}
          {!isGameRoute && !isDashboard && (
            <NavLink
              to="/"
              exact
              activeClassName="active"
              className="navbar__item"
            >
              Home
            </NavLink>
          )}

          {/* Raffles removed */}

          {/* Theme toggle (always visible) */}
          <ThemeToggle />

          {isAuthenticated ? (
            !isGameRoute ? <div className="navbar__sign-out"><SignOutPanel /></div> : null
          ) : (
            <div className="navbar__auth-links">
              <NavLink
                to="/signin"
                activeClassName="active"
                className="navbar__item"
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                activeClassName="active"
                className="navbar__item"
              >
                Sign Up
              </NavLink>
            </div>
          )}

          {/* Unified account cluster: avatar (non-dashboard) + token balance */}
          {isAuthenticated && showBalance && (
            <div className="navbar__account" data-tour-id="mode-toggle">
              {!isDashboard && firstName && (
                <div className="navbar__account-avatar" title={firstName} aria-label="Account">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
              <CoinBalance
                tokenBalance={tokenBalance}
                cashBalance={cashBalance}
                mode={mode}
                label={mode === 'arcade' ? 'K-BITS • Arcade' : 'Cash • Real'}
                compact={compact}
                armed={armed}
                onClick={handleToggleClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClick(); }}
                title={!realEnabled ? 'Real mode coming soon' : (armed ? `Tap again to switch to ${mode === 'arcade' ? 'Real' : 'Arcade'}` : `Current mode: ${mode === 'arcade' ? 'Arcade (K‑BITS)' : 'Real (Cash)'} • Tap twice to toggle`) }
                ariaLabel={`Current mode ${mode}. Tap twice to toggle`}
                testId="mode-toggle"
              />
            </div>
          )}

          {/* Dashboard: no token display → show a minimal chip to toggle */}
          {isAuthenticated && isDashboard && (
            <div
              className="navbar__mode-only"
              data-tour-id="mode-toggle"
              onClick={handleToggleClick}
              role="button"
              tabIndex={0}
              data-testid="mode-toggle"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClick(); }}
              title={`Current mode: ${mode === 'arcade' ? 'Arcade (K‑BITS)' : 'Real (Cash)'} • Tap twice to toggle`}
              aria-label={`Current mode ${mode}. Tap twice to toggle`}
            >
              <span className="mode-chip">{mode === 'arcade' ? 'Arcade' : 'Real'}</span>
            </div>
          )}

          {/* Version label */}
          <div className="navbar__version navbar__version--desktop">
            <VersionTag ariaLabelPrefix="Frontend build" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;