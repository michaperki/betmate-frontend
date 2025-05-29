import SignOutPanel from 'containers/authentication/signOutPanel';
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import CoinBalance from '../CoinBalance';
import './unified-navbar.scss';

export interface NavBarProps {
  isAuthenticated: boolean,
  firstName: string,
  isDarkTheme?: boolean,
  balance?: number,
  compact?: boolean, // Whether to use the compact variant (for game screens)
}

const NavBar: React.FC<NavBarProps> = (props) => {
  const { balance, compact = false } = props;
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Don't show balance on dashboard since it's displayed in HeroSection
  const showBalance = location.pathname !== '/';

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className={`navbar ${compact ? 'navbar--compact' : ''}`}>
      <div className="navbar__container">
        <NavLink to="/" className="navbar__brand" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="BetMate Logo" />
          <span>BetMate</span>
        </NavLink>

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
          <NavLink
            to="/"
            className={`navbar__item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>

          {props.isAuthenticated && (
            <NavLink
              to="/raffles"
              className={`navbar__item ${location.pathname === '/raffles' ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Raffles
            </NavLink>
          )}

          {props.isAuthenticated ? (
            <div className="navbar__item navbar__item--button" onClick={() => setMenuOpen(false)}>
              <SignOutPanel />
            </div>
          ) : (
            <>
              <NavLink
                to="/signin"
                className={`navbar__item ${location.pathname === '/signin' ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                className={`navbar__item navbar__item--button ${location.pathname === '/signup' ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </NavLink>
            </>
          )}

          {/* Show balance if authenticated and not on dashboard */}
          {props.isAuthenticated && showBalance && (
            <div className="navbar__balance">
              <CoinBalance balance={balance} compact={compact} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;