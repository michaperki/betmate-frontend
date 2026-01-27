import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useHistory } from 'react-router-dom';
import { RootState, ActionTypes } from 'types/state';
import { signInUser } from 'store/actionCreators/authActionCreators';
import { loadingSelector, errorSelector } from 'store/actionCreators/requestActionCreators';

const loadActions: ActionTypes[] = ['SIGN_IN_USER'];

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const isLoading = useSelector((s: RootState) => loadingSelector(loadActions, s));
  const errorMessages = useSelector((s: RootState) => errorSelector(loadActions, s));

  const [loginMethod, setLoginMethod] = useState<'email' | 'wallet'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState<string | null>(null);

  const returnTo = useMemo(() => {
    try {
      const q = new URLSearchParams(location.search || '');
      const from = q.get('from');
      return from ? decodeURIComponent(from) : '/';
    } catch { return '/'; }
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated) {
      history.replace(returnTo);
    }
  }, [isAuthenticated, history, returnTo]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(signInUser(email, password));
  };

  const onWalletConnect = (provider: string) => {
    setWalletConnecting(provider);
    setTimeout(() => setWalletConnecting(null), 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      color: '#e8e8e8',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgb(var(--mode-accent-rgb) / 0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />

      {/* Content grid */}
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 520px', gap: 40, padding: '40px 20px' }}>
        {/* Left brand/hero (hidden on very small screens) */}
        <div style={{ display: 'none' }} className="desktop-only">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#f87171' }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--mode-accent)' }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#60a5fa' }} />
            </div>
            <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--mode-accent)', letterSpacing: '1px' }}>BetMate</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, margin: '0 0 24px' }}>
            Bet on Chess,<br /><span style={{ color: 'var(--mode-accent)' }}>Live.</span>
          </h1>
          <p style={{ fontSize: 18, opacity: 0.6, lineHeight: 1.6, margin: 0 }}>
            Predict moves, bet on outcomes, and win while watching the world's best players compete in real-time.
          </p>
        </div>

        {/* Right login card */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(10px)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>Welcome back</h2>
            <p style={{ fontSize: 14, opacity: 0.5, margin: '0 0 24px', textAlign: 'center' }}>Sign in to continue betting</p>

            {/* Login method toggle */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, marginBottom: 24 }}>
              <button onClick={() => setLoginMethod('email')} style={{ flex: 1, padding: 12, background: loginMethod === 'email' ? 'rgb(var(--mode-accent-rgb) / 0.15)' : 'transparent', border: loginMethod === 'email' ? '1px solid rgb(var(--mode-accent-rgb) / 0.30)' : '1px solid transparent', borderRadius: 10, color: loginMethod === 'email' ? 'var(--mode-accent)' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>📧 Email</button>
              <button onClick={() => setLoginMethod('wallet')} style={{ flex: 1, padding: 12, background: loginMethod === 'wallet' ? 'rgb(var(--mode-accent-rgb) / 0.15)' : 'transparent', border: loginMethod === 'wallet' ? '1px solid rgb(var(--mode-accent-rgb) / 0.30)' : '1px solid transparent', borderRadius: 10, color: loginMethod === 'wallet' ? 'var(--mode-accent)' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>🔗 Wallet</button>
            </div>

            {loginMethod === 'email' ? (
              <form onSubmit={onSubmit}>
                <label htmlFor="email" style={{ fontSize: 12, opacity: 0.7 }}>Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{ width: '100%', padding: 12, borderRadius: 10, margin: '6px 0 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8', fontFamily: 'inherit' }} />

                <label htmlFor="password" style={{ fontSize: 12, opacity: 0.7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ width: '100%', padding: 12, borderRadius: 10, margin: '6px 0 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8', fontFamily: 'inherit' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 8, top: 10, background: 'transparent', border: 'none', color: '#e8e8e8', cursor: 'pointer' }}>{showPassword ? '🙈' : '👁️'}</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.7 }}><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me</label>
                  <a href="#" style={{ fontSize: 12, opacity: 0.6, textDecoration: 'none', color: '#e8e8e8' }}>Forgot?</a>
                </div>

                {errorMessages && errorMessages[0] && (
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
                    {errorMessages[0]}
                  </div>
                )}

                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 'none', borderRadius: 12, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                  {['Metamask', 'WalletConnect', 'Coinbase Wallet'].map(w => (
                    <button key={w} disabled={!!walletConnecting} onClick={() => onWalletConnect(w)} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8', cursor: 'pointer' }}>
                      {walletConnecting === w ? `Connecting ${w}…` : `Connect ${w}`}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Wallet login is not configured in this environment. Please use email login.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
