import SignOutPanel from 'containers/authentication/signOutPanel';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import CoinBalance from '../CoinBalance';

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

  // Don't show balance on dashboard since it's displayed in HeroSection
  const showBalance = location.pathname !== '/';

  return (
    <nav className={`nav ${compact ? 'nav--compact' : ''}`}>
      <NavLink to="/" className="nav__brand">
        <img src={logo} alt="BetMate Logo" />
        <span className={compact ? 'hidden md:block' : ''}>BetMate</span>
      </NavLink>

      <div className="nav__menu">
        <NavLink
          to="/"
          className={`nav__item ${location.pathname === '/' ? 'active' : ''}`}
        >
          home
        </NavLink>

        {props.isAuthenticated && (
          <NavLink
            to="/raffles"
            className={`nav__item ${location.pathname === '/raffles' ? 'active' : ''}`}
          >
            raffles
          </NavLink>
        )}

        {props.isAuthenticated ? (
          <div className="nav__item">
            <SignOutPanel />
          </div>
        ) : (
          <>
            <NavLink
              to="/signin"
              className={`nav__item ${location.pathname === '/signin' ? 'active' : ''}`}
            >
              sign in
            </NavLink>
            <NavLink
              to="/signup"
              className={`nav__item ${location.pathname === '/signup' ? 'active' : ''}`}
            >
              sign up
            </NavLink>
          </>
        )}

        {props.isAuthenticated && showBalance && (
          <div className="ml-4">
            <CoinBalance balance={balance} compact={compact} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;