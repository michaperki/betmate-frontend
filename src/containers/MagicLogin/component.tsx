import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { setBearerToken } from 'store/actionCreators';
import * as authRequests from 'store/requests/authRequests';
import { JWT_SIGN_IN } from 'types/resources/auth';

const MagicLogin: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const res = await authRequests.magicSignIn(token);
        if (res.token) setBearerToken(res.token);
        if (res.user) dispatch({ type: JWT_SIGN_IN, payload: { user: res.user }, status: 'SUCCESS' } as any);
        // Preserve existing query; default to showing setup once
        const q = new URLSearchParams(location.search || '');
        if (!q.get('setup')) q.set('setup', '1');
        history.replace(`/${q.toString() ? `?${q.toString()}` : ''}`);
      } catch (e: any) {
        setError(e?.message || 'Magic login failed');
        // Redirect to signin after brief delay
        setTimeout(() => history.replace('/signin'), 1200);
      }
    };
    run();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>{error ? 'Magic login failed' : 'Signing you in…'}</div>
        {!error && <div style={{ fontSize: 13, opacity: 0.6 }}>Please wait</div>}
      </div>
    </div>
  );
};

export default MagicLogin;
