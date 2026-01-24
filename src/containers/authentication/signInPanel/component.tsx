import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router';
import { signInUser as signInUserType } from 'store/actionCreators/authActionCreators';
import logo from '../../../assets/logo.svg';
import '../dark-style.scss';
import '../inline-reset.css';

export interface SignInPanelProps extends RouteComponentProps {
  isAuthenticated: boolean,
  isLoading: boolean,
  errorMessages: string[],
  signInUser: typeof signInUserType
}

const SignInPanel: React.FC<SignInPanelProps> = (props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formValidationErrors, setFormValidationErrors] = useState('');

  const history = useHistory();

  useEffect(() => {
    if (props.isAuthenticated) {
      try {
        const q = new URLSearchParams((props.location && props.location.search) || '');
        const from = q.get('from');
        if (from) {
          const decoded = decodeURIComponent(from);
          history.push(decoded);
        } else {
          history.push('/');
        }
      } catch {
        history.push('/');
      }
    }
  }, [props.isAuthenticated]);

  const handleEmailUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFormValidationErrors('');

    if (!email) {
      setFormValidationErrors('Please enter an email address!');
    } else if (!password) {
      setFormValidationErrors('Please enter a password!');
    } else {
      // Send only if all fields filled in
      props.signInUser(email, password);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-padding-container">
          <div className="title-container">
            <h1>Betmate</h1>
            <img src={logo} alt="logo"/>
          </div>
          <form className="form-container" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailUpdate}
              autoComplete="email"
              placeholder="Enter your email"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordUpdate}
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <input
              type="submit"
              value="Sign In"
              disabled={props.isLoading}
            />
          </form>

          <div className="auth-status-message-container">
            {props.isLoading ?
              <div className="loading-message">Authenticating...</div> :
              <div>{props.errorMessages[0]}</div>
            }
            {formValidationErrors && <div>{formValidationErrors}</div>}
          </div>

          <div className="auth-redirect-links">
            <span
              className="auth-redirect-link"
              onClick={() => history.push('/')}
            >
              Dashboard
            </span>
            <span className="divider">|</span>
            <span
              className="auth-redirect-link"
              onClick={() => history.push('/signup')}
            >
              Create Account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPanel;
