import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import * as authRequests from 'store/requests/authRequests';
import { setBearerToken } from 'store/actionCreators';
import { useDispatch } from 'react-redux';
import { JWT_SIGN_IN } from 'types/resources/auth';

const MagicLogin: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const history = useHistory();
  const dispatch = useDispatch();
  const [state, setState] = useState<'pending'|'success'|'error'>('pending');
  const [message, setMessage] = useState<string>('Signing you in…');

  useEffect(() => {
    const run = async () => {
      try {
        if (!token) { setState('error'); setMessage('Invalid link'); return; }
        const res = await authRequests.magicLogin(token);
        const jwt = (res?.data as any)?.token;
        const user = (res?.data as any)?.user;
        if (!jwt || !user) {
          setState('error'); setMessage('Invalid response'); return;
        }
        setBearerToken(jwt);
        dispatch({ type: JWT_SIGN_IN, status: 'SUCCESS', payload: { user } } as any);
        setState('success');
        // Nudge the guided tour via query param
        const url = new URL('/', window.location.origin);
        url.searchParams.set('tour', '1');
        history.replace(url.pathname + url.search);
      } catch (e: any) {
        setState('error');
        const err = e?.response?.data?.error || e?.message || 'Magic link failed';
        setMessage(String(err));
      }
    };
    run();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: 24, borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>BetMate</div>
        {state === 'pending' && <div>{message}</div>}
        {state === 'error' && (
          <div>
            <div style={{ marginBottom: 8 }}>Could not sign you in.</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>{message}</div>
            <a href="/signin" style={{ color: 'var(--mode-accent)' }}>Go to Sign In</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLogin;

