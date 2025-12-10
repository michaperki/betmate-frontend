import React, { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import CoinBalance from '../CoinBalance';
import SignOutPanel from 'containers/authentication/signOutPanel';
import './unified-navbar.scss';
import VersionTag from '../VersionTag';
import { useMode } from 'context/ModeContext';

export interface NavBarProps {
  isAuthenticated: boolean;
  firstName: string;
  tokenBalance?: number;
  cashBalance?: number;
  compact?: boolean; // Whether to use the compact variant (for game screens)
  breadcrumb?: string; // Optional context label (currently used for non-game routes only)
}

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated, firstName, tokenBalance, cashBalance, compact = false, breadcrumb }) => {
  const [menuOpen, setMenuOpen] = useState(false);
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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const isGameRoute = location.pathname.startsWith('/chess');

  return (
    <nav className={`navbar ${compact ? 'navbar--compact' : ''}`}>
      <div className="navbar__container">
        <NavLink to="/" className="navbar__brand" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="BetMate Logo" />
          <span>BetMate</span>
        </NavLink>

        {/* Breadcrumb: keep original 'Live Game' label for game route */}
        {isGameRoute && (
          <div className="navbar__breadcrumb" aria-label="Breadcrumb">
            <NavLink to="/" className="navbar__crumb" onClick={() => setMenuOpen(false)}>Home</NavLink>
            <span className="navbar__crumb-sep">/</span>
            <span className="navbar__crumb-current">Live Game</span>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button 
          className={`navbar__toggle ${menuOpen ? 'open' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

          {/* Navigation menu */}
          <div className={`navbar__menu ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated && (
            <NavLink
              to="/wallet"
              exact
              activeClassName="active"
              className="navbar__item"
              onClick={() => setMenuOpen(false)}
            >
              Wallet
            </NavLink>
          )}
          {!isGameRoute && !isDashboard && (
            <NavLink
              to="/"
              exact
              activeClassName="active"
              className="navbar__item"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </NavLink>
          )}

          {/* Raffles removed */}

          {isAuthenticated ? (
            !isGameRoute ? <SignOutPanel /> : null
          ) : (
            <>
              <NavLink
                to="/signin"
                activeClassName="active"
                className="navbar__item"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                activeClassName="active"
                className="navbar__item"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </NavLink>
            </>
          )}

          {/* Unified account cluster: avatar (non-dashboard) + token balance */}
          {isAuthenticated && showBalance && (
            <div className="navbar__account">
              {!isDashboard && firstName && (
                <div className="navbar__account-avatar" title={firstName} aria-label="Account">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
              <CoinBalance
                tokenBalance={tokenBalance}
                cashBalance={cashBalance}
                mode={mode}
                label={mode === 'arcade' ? 'Arcade' : 'Real'}
                compact={compact}
                armed={armed}
                onClick={handleToggleClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClick(); }}
                title={!realEnabled ? 'Real mode coming soon' : (armed ? `Tap again to switch to ${mode === 'arcade' ? 'Real' : 'Arcade'}` : 'Tap twice to toggle mode')}
                ariaLabel={`Current mode ${mode}. Tap twice to toggle`}
              />
            </div>
          )}

          {/* Dashboard: no token display → show a minimal chip to toggle */}
          {isAuthenticated && isDashboard && (
            <div className="navbar__mode-only" onClick={handleToggleClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClick(); }}>
              <span className="mode-chip">{mode === 'arcade' ? 'Arcade' : 'Real'}</span>
            </div>
          )}

          {/* Mobile menu-only version label (appears at bottom of flyout) */}
          {menuOpen && (
            <div className="navbar__version">
              <VersionTag ariaLabelPrefix="Frontend build" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
