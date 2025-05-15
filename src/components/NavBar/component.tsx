import SignOutPanel from 'containers/authentication/signOutPanel';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import CoinBalance from '../CoinBalance';
import './style.scss';
import './dark-style.scss';

export interface NavBarProps {
  isAuthenticated: boolean,
  firstName: string,
  isDarkTheme?: boolean,
  balance?: number,
  compact?: boolean, // Whether to use the compact variant (for game screens)
}

const NavBar: React.FC<NavBarProps> = (props) => {
  const { isDarkTheme = true, balance, compact = false } = props;
  const location = useLocation();

  // Determine CSS class based on theme and compact mode
  const containerClass = `${isDarkTheme ? 'nav-container-dark' : 'nav-container'} ${compact ? 'compact' : ''}`;

  return (
    <div className={containerClass}>
      <div className="left-side">
        <NavLink to="/"><img src={logo} alt="logo" /></NavLink>
        <h1 className={compact ? 'compact-title' : ''}>BetMate</h1>
      </div>
      <div className="right-side">
        {/* Don't show nav buttons in compact mode */}
        {!compact && (
          <div className="nav-actions">
            <button className={location.pathname === '/' ? 'active' : ''}>
              <NavLink to="/">home</NavLink>
            </button>
            {props.isAuthenticated
              ? (
                <>
                  {/* <button>
                    <NavLink to="/user">Account</NavLink>
                  </button> */}
                  <button>
                    <SignOutPanel />
                  </button>
                </>
              ) : (
                <>
                  <button className={location.pathname === '/signin' ? 'active' : ''}>
                    <NavLink to="/signin">sign in</NavLink>
                  </button>
                  <button className={location.pathname === '/signup' ? 'active' : ''}>
                    <NavLink to="/signup">sign up</NavLink>
                  </button>
                </>
              )}
          </div>
        )}

        {props.isAuthenticated && (
          <div className="balance-container">
            <CoinBalance balance={balance} compact={compact} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;