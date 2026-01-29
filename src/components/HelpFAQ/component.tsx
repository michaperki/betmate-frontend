import React from 'react';
import { createPortal } from 'react-dom';

const sections: { title: string; body: string }[] = [
  { title: 'Why are some bets refunded?', body: 'Bets may be refunded if a game aborts, pricing becomes unavailable, or when caps/limits prevent fair settlement. Arcade tokens are unaffected by Real-mode limits.' },
  { title: 'Pari-mutuel vs House', body: 'Arcade pools are pari-mutuel (you bet against other players). Real WDL is house-priced with margins and exposure caps for risk control.' },
  { title: 'Risk rejections', body: 'Per-bet, per-player, per-outcome, per-game, or global caps can reject a Real WDL bet. Try a smaller stake or different outcome.' },
  { title: 'Deposits & Bonuses', body: 'You purchase KBits and receive BetMate Cash 1:1 as a bonus after confirmation. Fees and network confirmation times vary by currency.' },
];

const HelpFAQ: React.FC<{ isOpen: boolean; onClose: () => void } & { category?: string }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Help and FAQ" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 'min(660px, 94vw)', maxHeight: '90vh', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: 'var(--text-primary)', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgb(var(--text-primary-rgb) / 0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Help & FAQ</div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'rgb(var(--text-primary-rgb) / 0.06)', border: '1px solid rgb(var(--text-primary-rgb) / 0.12)', width: 28, height: 28, borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HelpFAQ;

