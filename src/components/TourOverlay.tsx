import React, { useEffect, useState } from 'react';
import * as authRequests from 'store/requests/authRequests';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps = [
  {
    title: 'Welcome to BetMate',
    body: 'Bet on live chess outcomes with real-time odds. We’ll show you around.',
  },
  {
    title: 'Browse Live Matches',
    body: 'Find featured games and explore markets. Odds update as the game evolves.',
  },
  {
    title: 'Place Your First Bet',
    body: 'Tap an outcome, enter your stake, and confirm. Track results in My Bets.',
  },
];

const TourOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  const [i, setI] = useState(0);
  useEffect(() => { if (!isOpen) setI(0); }, [isOpen]);
  if (!isOpen) return null;

  const complete = async () => {
    try { await authRequests.setOnboardingVersion(1); } catch {}
    onClose();
  };

  const next = () => {
    if (i < steps.length - 1) setI((p) => p + 1);
    else void complete();
  };

  const s = steps[i];
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={complete} />
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', height: '100%' }}>
        <div style={{
          width: 'min(560px, 92vw)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: 14, padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{s.title}</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{s.body}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <button onClick={complete} style={{
              background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8,
            }}>Skip</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{i + 1} / {steps.length}</div>
              <button onClick={next} style={{
                background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 0, color: '#000', padding: '8px 12px', borderRadius: 8, fontWeight: 800,
              }}>{i < steps.length - 1 ? 'Next' : 'Done'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;

