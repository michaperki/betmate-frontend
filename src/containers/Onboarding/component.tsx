import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import * as authRequests from 'store/requests/authRequests';
import { setBearerToken } from 'store/actionCreators';
import { JWT_SIGN_IN } from 'types/resources/auth';
import { getDeviceId } from 'utils';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const location = useLocation();
  const dispatch = useDispatch();
  const returnTo = useMemo(() => {
    try {
      const q = new URLSearchParams(location.search || '');
      const from = q.get('from');
      return from ? decodeURIComponent(from) : '/';
    } catch { return '/'; }
  }, [location.search]);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    agreeTerms: false, ageVerified: false,
    walletConnected: false, walletAddress: '',
    defaultStake: 2, oddsFormat: 'decimal', notifications: true,
    depositAmount: 50
  });
  // Capture and persist referral invite code for later account creation
  const [inviteCode, setInviteCode] = useState<string>('');
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search || '');
      const code = (q.get('code') || '').trim();
      if (code) {
        setInviteCode(code);
        try { window.localStorage.setItem('betmate:invite_code', code); } catch {}
      } else {
        try { const stored = window.localStorage.getItem('betmate:invite_code') || ''; if (stored) setInviteCode(stored); } catch {}
      }
    } catch {}
  }, [location.search]);
  const referred = useMemo(() => !!inviteCode, [inviteCode]);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [depositProcessing, setDepositProcessing] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const updateForm = (k: string, v: any) => setFormData((p) => ({ ...p, [k]: v }));
  const simulateWalletConnect = () => { setWalletConnecting(true); setTimeout(() => { setWalletConnecting(false); updateForm('walletConnected', true); updateForm('walletAddress', '0x7a3d...8f2e'); }, 1500); };
  const simulateDeposit = () => { setDepositProcessing(true); setTimeout(() => { setDepositProcessing(false); setStep(5); }, 2000); };
  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return !!(formData.username && formData.email && formData.password && formData.password === formData.confirmPassword && formData.agreeTerms && formData.ageVerified);
      case 2: return referred ? true : formData.walletConnected;
      case 3: return true;
      case 4: return referred ? true : (formData.depositAmount >= 10);
      default: return true;
    }
  };
  // Create account for referred users at Step 1
  const createReferredAccount = async () => {
    try {
      setCreateError(null);
      setCreatingAccount(true);
      const deviceId = getDeviceId();
      const firstName = formData.username || '';
      const lastName = '';
      const res = await authRequests.createUser(
        formData.email,
        formData.password,
        firstName,
        lastName,
        inviteCode,
        deviceId,
      );
      const token = (res?.data as any)?.token;
      const user = (res?.data as any)?.user;
      if (token) setBearerToken(token);
      if (user) dispatch({ type: JWT_SIGN_IN, payload: { user }, status: 'SUCCESS' } as any);
      setStep(3); // skip wallet step next
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };
  // Auto-skip wallet/deposit steps for referred users
  useEffect(() => {
    if (!referred) return;
    if (step === 2) setStep(3);
    if (step === 4) setStep(5);
  }, [referred, step]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', fontFamily: "'JetBrains Mono','SF Mono',monospace", color: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgb(var(--mode-accent-rgb) / 0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', top: '15%', left: '8%', fontSize: 120, opacity: 0.03, transform: 'rotate(-15deg)' }}>♞</div>
      <div style={{ position: 'fixed', bottom: '20%', right: '5%', fontSize: 100, opacity: 0.03, transform: 'rotate(10deg)' }}>♛</div>
      <div style={{ position: 'fixed', top: '60%', left: '5%', fontSize: 80, opacity: 0.02, transform: 'rotate(5deg)' }}>♜</div>

      <div style={{ width: 680, maxWidth: '100%', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fbbf24' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f87171' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--mode-accent)' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#60a5fa' }} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--mode-accent)', letterSpacing: '1px' }}>BetMate</span>
        </div>

        {step > 0 && step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: i <= step ? 32 : 12, height: 4, borderRadius: 2, background: i <= step ? 'var(--mode-accent)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(10px)' }}>
          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, rgb(var(--mode-accent-rgb) / 0.20) 0%, rgb(var(--mode-accent-rgb) / 0.05) 100%)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40 }}>♟️</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>Bet on Chess, Live</h1>
              <p style={{ fontSize: 15, opacity: 0.6, margin: '0 0 32px', lineHeight: 1.6 }}>Predict moves, bet on outcomes, and win while watching the world's best players compete.</p>
              {referred && inviteCode && (
                <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 12 }}>Invite code applied: <code>{inviteCode}</code></div>
              )}
              <button onClick={() => setStep(1)} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 'none', borderRadius: 12, color: '#000', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 16 }}>Get Started</button>
              <p style={{ fontSize: 13, opacity: 0.5, margin: 0 }}>
                Already have an account? <a href={`/signin?from=${encodeURIComponent(returnTo)}`} style={{ color: 'var(--mode-accent)' }}>Sign in</a>
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Create Account</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input placeholder="Username" value={formData.username} onChange={e => updateForm('username', e.target.value)} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }} />
                <input placeholder="Email" type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <input placeholder="Password" type="password" value={formData.password} onChange={e => updateForm('password', e.target.value)} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }} />
                <input placeholder="Confirm Password" type="password" value={formData.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }} />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <label><input type="checkbox" checked={formData.agreeTerms} onChange={e => updateForm('agreeTerms', e.target.checked)} /> I agree to Terms</label>
                <label><input type="checkbox" checked={formData.ageVerified} onChange={e => updateForm('ageVerified', e.target.checked)} /> I am 18+</label>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(0)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e8e8e8' }}>Back</button>
              <button
                disabled={!canProceed() || (referred && creatingAccount)}
                onClick={() => { if (referred) { void createReferredAccount(); } else { setStep(2); } }}
                style={{ padding: '10px 16px', background: canProceed() ? 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)' : 'rgb(var(--mode-accent-rgb) / 0.15)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
              >
                {referred && creatingAccount ? 'Creating…' : 'Continue'}
              </button>
              {createError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{createError}</div>
              )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Connect Wallet</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <button onClick={simulateWalletConnect} disabled={walletConnecting} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>{walletConnecting ? 'Connecting…' : 'Connect'}</button>
                {formData.walletConnected && <span style={{ color: 'var(--mode-accent)', fontWeight: 600 }}>{formData.walletAddress}</span>}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e8e8e8' }}>Back</button>
                <button disabled={!canProceed()} onClick={() => setStep(3)} style={{ padding: '10px 16px', background: canProceed() ? 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)' : 'rgb(var(--mode-accent-rgb) / 0.15)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Preferences</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Default Stake <input type="number" value={formData.defaultStake} onChange={e => updateForm('defaultStake', Number(e.target.value))} style={{ marginLeft: 8 }} /></label>
                <label>Odds Format
                  <select value={formData.oddsFormat} onChange={e => updateForm('oddsFormat', e.target.value)} style={{ marginLeft: 8 }}>
                    <option value="decimal">Decimal</option>
                    <option value="fractional">Fractional</option>
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e8e8e8' }}>Back</button>
                <button onClick={() => setStep(referred ? 5 : 4)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>First Deposit</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <input type="number" min={10} value={formData.depositAmount} onChange={e => updateForm('depositAmount', Number(e.target.value))} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }} />
                <button onClick={simulateDeposit} disabled={depositProcessing || !canProceed()} style={{ padding: '10px 16px', background: canProceed() ? 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)' : 'rgb(var(--mode-accent-rgb) / 0.15)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>{depositProcessing ? 'Processing…' : 'Deposit'}</button>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(3)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e8e8e8' }}>Back</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>All set!</h2>
              <p style={{ opacity: 0.6 }}>You are ready to start betting.</p>
              <a href={returnTo} style={{ display: 'inline-block', marginTop: 12, padding: '12px 16px', background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', borderRadius: 8, color: '#000', fontWeight: 700, textDecoration: 'none' }}>Go to Dashboard</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
