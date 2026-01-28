import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from 'components/NotificationCenter/context';
import { createPortal } from 'react-dom';
import { KBITS_PER_USD } from 'utils/config';
import { createDepositIntent, getDepositQuote, listDeposits, confirmDepositMock } from 'store/requests/billingRequests';

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// K-first modal; generates NOWPayments link via backend
const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');
  // Work in K (tokens); convert to USD using KBITS_PER_USD ratio
  const [kbits, setKbits] = useState<number>(KBITS_PER_USD * 25); // default ~$25
  const [customK, setCustomK] = useState<string>('');
  const [payCurrency, setPayCurrency] = useState<string>('USDTTRC20');
  const [quote, setQuote] = useState<{ charge_usd: number; fee_usd: number; estimated_pay_amount: number } | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string>('');
  const [depositId, setDepositId] = useState<string>('');
  const [linkLoading, setLinkLoading] = useState<boolean>(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const { notifySuccess } = useNotifications();

  useEffect(() => {
    if (!isOpen) {
      // reset state when closed
      setStep('amount');
      setKbits(KBITS_PER_USD * 25);
      setCustomK('');
      setPayCurrency('USDTTRC20');
      setQuote(null);
      setHostedUrl('');
      setDepositId('');
      setLinkLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // move focus to the close button for accessibility
    setTimeout(() => { try { closeRef.current?.focus(); } catch {} }, 0);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presetsK = [KBITS_PER_USD * 1, KBITS_PER_USD * 5, KBITS_PER_USD * 25, KBITS_PER_USD * 50, KBITS_PER_USD * 100];
  const usdAmount = Math.max(5, Math.min(10000, Math.round((kbits / KBITS_PER_USD) * 100) / 100));

  // Update quote on USD or currency change
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getDepositQuote(usdAmount, payCurrency);
        if (!active) return;
        const data = res?.data || {};
        setQuote({
          charge_usd: Number(data.charge_usd || usdAmount),
          fee_usd: Number(data.fee_usd || 0),
          estimated_pay_amount: Number(data.estimated_pay_amount || 0),
        });
      } catch {
        if (active) setQuote(null);
      }
    })();
    return () => { active = false; };
  }, [usdAmount, payCurrency]);

  const onDeposit = async () => {
    if (usdAmount < 5) return;
    setStep('processing');
    try {
      const res = await createDepositIntent(usdAmount, payCurrency);
      const hosted = String(res?.data?.hosted_url || '');
      const id = String(res?.data?.deposit_id || '');
      setHostedUrl('');
      setDepositId(id);
      setStep('success');
      try { notifySuccess('Invoice Created', `${kbits.toLocaleString()} K • Bonus $${usdAmount.toFixed(2)}`); } catch {}
      const isAbsolute = (u: string) => /^https?:\/\//i.test(u);
      if (isAbsolute(hosted)) {
        setHostedUrl(hosted);
        try { window.open(hosted, '_blank'); } catch {}
      } else if (id) {
        setLinkLoading(true);
        for (let i = 0; i < 4; i += 1) {
          try {
            const list = await listDeposits();
            const arr = (list?.data?.deposits || []) as any[];
            const found = arr.find((d) => String(d?._id) === id);
            const url = String(found?.metadata?.payment_url || '');
            if (isAbsolute(url)) {
              setHostedUrl(url);
              try { window.open(url, '_blank'); } catch {}
              break;
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 600));
        }
        setLinkLoading(false);
      }
    } catch {
      setStep('amount');
    }
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="deposit-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
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
        {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgb(var(--mode-accent-rgb) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
              <div>
                <div id="deposit-modal-title" style={{ fontSize: 16, fontWeight: 700 }}>Buy K</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Receive BetMate Cash bonus 1:1 with USD</div>
              </div>
            </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', width: 32, height: 32, borderRadius: 8, color: '#e8e8e8', cursor: 'pointer' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, overflowY: 'auto' }}>
          {step === 'amount' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Select Amount (K)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {presetsK.map(p => (
                    <button
                      key={p}
                      onClick={() => { setKbits(p); setCustomK(''); }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        background: kbits === p && !customK ? 'rgb(var(--mode-accent-rgb) / 0.18)' : 'rgba(255,255,255,0.05)',
                        border: kbits === p && !customK ? '1px solid rgb(var(--mode-accent-rgb) / 0.35)' : '1px solid rgba(255,255,255,0.1)',
                        color: kbits === p && !customK ? 'var(--mode-accent)' : '#e8e8e8',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >{p.toLocaleString()} K</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="Custom K"
                    value={customK}
                    onChange={(e) => { setCustomK(e.target.value); const v = Math.max(0, Math.round(Number(e.target.value || '0'))); setKbits(v); }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: customK ? '1px solid rgb(var(--mode-accent-rgb) / 0.35)' : '1px solid rgba(255,255,255,0.1)', color: '#e8e8e8', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>You’re buying <b>{kbits.toLocaleString()} K</b> • Bonus <b>${usdAmount.toFixed(2)}</b></div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>Pay currency</span>
                    <select value={payCurrency} onChange={e => setPayCurrency(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: '#0b0b12', border: '1px solid rgba(255,255,255,0.25)', color: '#e8e8e8', appearance: 'none' }}>
                      <option value="USDTTRC20">USDT (TRC20)</option>
                      <option value="USDTBEP20">USDT (BEP20)</option>
                      <option value="USDTERC20">USDT (ERC20)</option>
                      <option value="USDC">USDC</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>
                {quote ? (
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                    Est. pay: <b>{quote.estimated_pay_amount.toFixed(6)} {payCurrency}</b> (~${quote.charge_usd.toFixed(2)} incl. fees ~${quote.fee_usd.toFixed(2)})
                  </div>
                ) : (
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Fetching quote…</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e8e8e8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={onDeposit} disabled={usdAmount < 5} style={{ flex: 1, padding: 12, borderRadius: 10, background: usdAmount >= 5 ? 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)' : 'rgb(var(--mode-accent-rgb) / 0.14)', border: 'none', color: usdAmount >= 5 ? '#000' : '#7f7f7f', fontWeight: 800, cursor: usdAmount >= 5 ? 'pointer' : 'not-allowed' }}>Buy {kbits.toLocaleString()} K</button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', border: '3px solid rgb(var(--mode-accent-rgb) / 0.15)', borderTopColor: 'var(--mode-accent)', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Processing…</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Confirm the transaction in your wallet</div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '26px 0' }}>
              <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%', background: 'rgb(var(--mode-accent-rgb) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Invoice Created</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>Complete the payment in your wallet/provider</div>
              {hostedUrl && (
                <div style={{ marginBottom: 12 }}>
                  <a href={hostedUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', color: '#000', fontWeight: 800, textDecoration: 'none' }}>Open Invoice</a>
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7, wordBreak: 'break-all' }}>{hostedUrl}</div>
                </div>
              )}
              {!hostedUrl && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                    {linkLoading ? 'Preparing provider link…' : 'Invoice created. Waiting for provider link…'}
                  </div>
                  {depositId && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={async () => { try { await confirmDepositMock(depositId, 'confirmed'); } catch {} }}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e8e8e8', cursor: 'pointer', fontSize: 12 }}
                        title="Dev only: triggers mock webhook"
                      >Confirm (Mock)</button>
                      <button
                        onClick={() => { try { navigator.clipboard?.writeText(depositId); } catch {} }}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e8e8e8', cursor: 'pointer', fontSize: 12 }}
                      >Copy Deposit ID</button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e8e8e8', cursor: 'pointer' }}>Close</button>
                <button onClick={() => setStep('amount')} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e8e8e8', cursor: 'pointer' }}>New Deposit</button>
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

export default DepositModal;
