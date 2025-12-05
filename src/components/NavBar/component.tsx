import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import CoinBalance from '../CoinBalance';
import SignOutPanel from 'containers/authentication/signOutPanel';
import './unified-navbar.scss';

export interface NavBarProps {
  isAuthenticated: boolean;
  firstName: string;
  balance?: number;
  compact?: boolean; // Whether to use the compact variant (for game screens)
}

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated, firstName, balance, compact = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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
            exact
            activeClassName="active"
            className="navbar__item"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/raffles"
              activeClassName="active"
              className="navbar__item"
              onClick={() => setMenuOpen(false)}
            >
              Raffles
            </NavLink>
          )}

          {isAuthenticated ? (
            <div className="navbar__item navbar__item--button" onClick={() => setMenuOpen(false)}>
              <SignOutPanel />
            </div>
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
                className="navbar__item navbar__item--button"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </NavLink>
            </>
          )}

          {/* Show balance if authenticated and not on dashboard */}
          {isAuthenticated && showBalance && (
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
