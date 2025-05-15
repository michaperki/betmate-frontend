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
}

const NavBar: React.FC<NavBarProps> = (props) => {
  const { isDarkTheme = true, balance } = props;
  const location = useLocation();
  
  return (
    <div className={isDarkTheme ? "nav-container-dark" : "nav-container"}>
      <div className="left-side">
        <NavLink to="/"><img src={logo} alt="logo" /></NavLink>
        <h1>BetMate</h1>
      </div>
      <div className="right-side">
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
        
        {props.isAuthenticated && (
          <div className="balance-container">
            <CoinBalance balance={balance} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;