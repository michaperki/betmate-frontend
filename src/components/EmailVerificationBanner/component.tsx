import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { checkEmailVerificationStatus } from 'store/actionCreators/authActionCreators';
import { createBackendAxiosRequest } from 'store/requests';
import { getBearerTokenHeader } from 'store/actionCreators';
import { StoreState } from 'types/state';
import './style.scss';

const EmailVerificationBanner: React.FC = () => {
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const user = useSelector((state: StoreState) => state.auth.user);
  const emailVerificationStatus = useSelector((state: StoreState) => state.auth.emailVerificationStatus);

  useEffect(() => {
    if (user) {
      dispatch(checkEmailVerificationStatus());
    }
  }, [user, dispatch]);

  // Don't show the banner if verification isn't required or user is verified
  if (!emailVerificationStatus || !emailVerificationStatus.required || emailVerificationStatus.verified) {
    return null;
  }

  const handleResendEmail = async () => {
    setSending(true);
    setError(null);

    try {
      const email = user?.email;
      const headers = getBearerTokenHeader();
      // Dev-only: surface what we're sending
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[resend-verification] FE sending', { hasAuth: !!(headers as any).Authorization, email });
      }
      // Force the request to use the shared client with Authorization and a body email fallback
      await createBackendAxiosRequest<{ sent: boolean}>({
        method: 'POST',
        url: '/auth/resend-verification',
        data: email ? { email } : {},
        headers,
      });
      // Set sent to true immediately to show feedback
      setSent(true);

      // Reset the "sent" state after 5 seconds
      setTimeout(() => {
        setSent(false);
      }, 5000);
    } catch (err) {
      setError('An error occurred while sending the verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="email-verification-banner">
      <div className="banner-content">
        <div className="banner-icon">📧</div>
        <div className="banner-text">
          <p>Please verify your email address to unlock all features.</p>
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="banner-actions">
          {sending ? (
            <button className="resend-button loading" disabled>
              <span className="loading-spinner"></span> Sending...
            </button>
          ) : sent ? (
            <button className="resend-button sent" disabled>
              ✓ Email Sent
            </button>
          ) : (
            <button className="resend-button" onClick={handleResendEmail}>
              Resend Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
