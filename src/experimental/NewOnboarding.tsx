import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const NewOnboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const location = useLocation();
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
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [depositProcessing, setDepositProcessing] = useState(false);
  const updateForm = (k: string, v: any) => setFormData((p) => ({ ...p, [k]: v }));
  const simulateWalletConnect = () => { setWalletConnecting(true); setTimeout(() => { setWalletConnecting(false); updateForm('walletConnected', true); updateForm('walletAddress', '0x7a3d...8f2e'); }, 1500); };
  const simulateDeposit = () => { setDepositProcessing(true); setTimeout(() => { setDepositProcessing(false); setStep(5); }, 2000); };
  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return !!(formData.username && formData.email && formData.password && formData.password === formData.confirmPassword && formData.agreeTerms && formData.ageVerified);
      case 2: return formData.walletConnected;
      case 3: return true;
      case 4: return formData.depositAmount >= 10;
      default: return true;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', fontFamily: "'JetBrains Mono','SF Mono',monospace", color: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', top: '15%', left: '8%', fontSize: 120, opacity: 0.03, transform: 'rotate(-15deg)' }}>♞</div>
      <div style={{ position: 'fixed', bottom: '20%', right: '5%', fontSize: 100, opacity: 0.03, transform: 'rotate(10deg)' }}>♛</div>
      <div style={{ position: 'fixed', top: '60%', left: '5%', fontSize: 80, opacity: 0.02, transform: 'rotate(5deg)' }}>♜</div>

      <div style={{ width: 680, maxWidth: '100%', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fbbf24' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f87171' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#60a5fa' }} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#22c55e', letterSpacing: '1px' }}>BetMate</span>
        </div>

        {step > 0 && step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: i <= step ? 32 : 12, height: 4, borderRadius: 2, background: i <= step ? '#22c55e' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(10px)' }}>
          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40 }}>♟️</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>Bet on Chess, Live</h1>
              <p style={{ fontSize: 15, opacity: 0.6, margin: '0 0 32px', lineHeight: 1.6 }}>Predict moves, bet on outcomes, and win while watching the world's best players compete.</p>
              <button onClick={() => setStep(1)} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', borderRadius: 12, color: '#000', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 16 }}>Get Started</button>
              <p style={{ fontSize: 13, opacity: 0.5, margin: 0 }}>
                Already have an account? <a href={`/signin?from=${encodeURIComponent(returnTo)}`} style={{ color: '#22c55e' }}>Sign in</a>
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
                <button disabled={!canProceed()} onClick={() => setStep(2)} style={{ padding: '10px 16px', background: canProceed() ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Connect Wallet</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <button onClick={simulateWalletConnect} disabled={walletConnecting} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>{walletConnecting ? 'Connecting…' : 'Connect'}</button>
                {formData.walletConnected && <span style={{ color: '#22c55e', fontWeight: 600 }}>{formData.walletAddress}</span>}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e8e8e8' }}>Back</button>
                <button disabled={!canProceed()} onClick={() => setStep(3)} style={{ padding: '10px 16px', background: canProceed() ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>Continue</button>
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
                <button onClick={() => setStep(4)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>First Deposit</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <input type="number" min={10} value={formData.depositAmount} onChange={e => updateForm('depositAmount', Number(e.target.value))} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8' }} />
                <button onClick={simulateDeposit} disabled={depositProcessing || !canProceed()} style={{ padding: '10px 16px', background: canProceed() ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>{depositProcessing ? 'Processing…' : 'Deposit'}</button>
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
              <a href={returnTo} style={{ display: 'inline-block', marginTop: 12, padding: '12px 16px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: 8, color: '#000', fontWeight: 700, textDecoration: 'none' }}>Go to Dashboard</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewOnboarding;
