import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from 'components/NotificationCenter/context';
import { createPortal } from 'react-dom';

type WithdrawModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Lightweight mock Withdraw modal: visual only, mirrors Deposit styling
const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(50);
  const [custom, setCustom] = useState<string>('');
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const { notifyInfo } = useNotifications();

  useEffect(() => {
    if (!isOpen) {
      setStep('amount');
      setAmount(50);
      setCustom('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    setTimeout(() => { try { closeRef.current?.focus(); } catch {} }, 0);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets = [25, 50, 100, 250, 500];

  const onWithdraw = () => {
    if (amount < 10) return;
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      try { notifyInfo('Withdrawal Processing', `$${Number(amount).toFixed(2)} will arrive in ~10 minutes`); } catch {}
    }, 1500);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="withdraw-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative',
        width: 'min(520px, 92vw)',
        maxHeight: '90vh',
        background: 'linear-gradient(180deg, #1a1a24 0%, #12121a 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        color: '#e8e8e8',
        fontFamily: "'JetBrains Mono','SF Mono',monospace",
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏧</div>
            <div>
              <div id="withdraw-modal-title" style={{ fontSize: 16, fontWeight: 700 }}>Withdraw Funds</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Send funds to your wallet</div>
            </div>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', width: 32, height: 32, borderRadius: 8, color: '#e8e8e8', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto' }}>
          {step === 'amount' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Select Amount</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {presets.map(p => (
                    <button
                      key={p}
                      onClick={() => { setAmount(p); setCustom(''); }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        background: amount === p && !custom ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.05)',
                        border: amount === p && !custom ? '1px solid rgba(244,63,94,0.35)' : '1px solid rgba(255,255,255,0.1)',
                        color: amount === p && !custom ? '#f87171' : '#e8e8e8',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >${p}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>$</span>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={custom}
                    onChange={(e) => { setCustom(e.target.value); setAmount(parseFloat(e.target.value || '0') || 0); }}
                    style={{ width: '100%', padding: '10px 12px 10px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: custom ? '1px solid rgba(244,63,94,0.35)' : '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.5, marginTop: 6 }}>
                  <span>Min $10</span>
                  <span>Max $10,000</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e8e8e8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={onWithdraw} disabled={amount < 10} style={{ flex: 1, padding: 12, borderRadius: 10, background: amount >= 10 ? 'linear-gradient(135deg,#f87171 0%,#ef4444 100%)' : 'rgba(244,63,94,0.14)', border: 'none', color: amount >= 10 ? '#000' : '#7f7f7f', fontWeight: 800, cursor: amount >= 10 ? 'pointer' : 'not-allowed' }}>Withdraw</button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', border: '3px solid rgba(244,63,94,0.15)', borderTopColor: '#ef4444', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Processing…</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Please confirm the withdrawal in your wallet</div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '26px 0' }}>
              <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Withdrawal Submitted</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>Funds will arrive shortly</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#f87171 0%,#ef4444 100%)', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                <button onClick={() => setStep('amount')} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e8e8e8', cursor: 'pointer' }}>New Withdrawal</button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default WithdrawModal;
