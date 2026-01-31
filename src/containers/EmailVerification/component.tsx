import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail } from 'store/actionCreators/authActionCreators';
import { StoreState } from 'types/state';
import Header from 'components/Header';
import './style.scss';

const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const history = useHistory();
  const dispatch = useDispatch();
  const [verifying, setVerifying] = useState<boolean>(true);

  const verificationState = useSelector((state: StoreState) => ({
    status: state.auth.verificationStatus,
    error: state.auth.verificationError
  }));

  const success = verificationState.status === 'verified';
  const error = verificationState.error;

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }

    // Dispatch the verify email action
    dispatch(verifyEmail(token));

    // Set a timeout to change the verifying state after a reasonable time
    const timeout = setTimeout(() => {
      setVerifying(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [token, dispatch]);

  // Update verifying state when verification status changes
  useEffect(() => {
    if (success || error) {
      setVerifying(false);
    }
  }, [success, error]);

  const handleContinue = () => {
    history.push('/dashboard');
  };

  return (
    <div className="email-verification-page">
      <Header />
      <div className="verification-container">
        <div className="verification-card">
          <h2>Email Verification</h2>
          
          {verifying && (
            <div className="verification-status">
              <div className="loader"></div>
              <p>Verifying your email...</p>
            </div>
          )}

          {!verifying && success && (
            <div className="verification-success">
              <div className="success-icon">✓</div>
              <h3>Email Verified Successfully!</h3>
              <p>Your email has been verified and your account is now active.</p>
              <button className="continue-button" onClick={handleContinue}>
                Continue to Dashboard
              </button>
            </div>
          )}

          {!verifying && !success && (
            <div className="verification-error">
              <div className="error-icon">✗</div>
              <h3>Verification Failed</h3>
              <p>{error || 'Something went wrong'}</p>
              <p>This could be because:</p>
              <ul>
                <li>The verification link has expired</li>
                <li>Your email is already verified</li>
                <li>The verification token is invalid</li>
              </ul>
              <button className="login-button" onClick={() => history.push('/login')}>
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;