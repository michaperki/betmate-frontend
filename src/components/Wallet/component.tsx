import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import { RootState } from 'types/state';
import { createDepositIntent, listDeposits } from 'store/requests/billingRequests';
import { ENABLE_REAL_DEPOSITS, PAYMENT_SUCCESS_URL, PAYMENT_CANCEL_URL, SHOW_DEPOSIT_IDS } from 'utils/config';
import './style.scss';

interface DepositItem {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  provider: string;
  provider_ref?: string;
  created_at: string;
}

const Wallet: React.FC = () => {
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(25);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const tokenBalance = user?.token_balance ?? user?.account ?? 0;
  const cashBalance = (user as any)?.cash_balance ?? 0;

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setErr(null);
    try {
      const res = await listDeposits();
      const arr = (res?.data?.deposits || []) as DepositItem[];
      setDeposits(arr);
    } catch (e: any) {
      setErr('Failed to load deposit history');
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);

  // Read payment status from query string
  const statusParam = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      return sp.get('status');
    } catch { return null; }
  }, [location.search]);

  useEffect(() => {
    if (!statusParam) { setBanner(null); return; }
    if (statusParam === 'success') setBanner('Payment successful. Your balance will update after confirmation.');
    else if (statusParam === 'cancel') setBanner('Payment cancelled. You can try again any time.');
    else setBanner(null);
  }, [statusParam]);

  const onDeposit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const amt = Math.max(5, Math.min(10000, Number(amount || 0)));
      const res = await createDepositIntent(amt, 'USDT');
      const hosted = res?.data?.hosted_url || '#';
      if (hosted && hosted !== '#') window.open(hosted, '_blank');
      await refresh();
    } catch (e: any) {
      setErr('Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-page">
      <NavBar />
      <div className="wallet-container">
        <header className="wallet-header">
          <h1>Wallet</h1>
          {banner && <div className="wallet-banner wallet-banner--info">{banner}</div>}
          {ENABLE_REAL_DEPOSITS ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min={5}
                max={10000}
                step={5}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="wallet-amount-input"
                aria-label="Deposit amount"
              />
              <button className="wallet-deposit-btn" onClick={onDeposit} disabled={loading || !isAuthenticated}>
                {loading ? 'Starting…' : 'Add USDT'}
              </button>
            </div>
          ) : (
            <div className="wallet-disabled">Real deposits are disabled</div>
          )}
        </header>
        {ENABLE_REAL_DEPOSITS && (
          <div className="wallet-hint">
            Redirects: <code>{PAYMENT_SUCCESS_URL}</code> (success), <code>{PAYMENT_CANCEL_URL}</code> (cancel)
          </div>
        )}
        {err && <div className="wallet-error">{err}</div>}
        <section className="wallet-balances">
          <div className="wallet-card">
            <div className="wallet-card__label">Arcade Tokens</div>
            <div className="wallet-card__value">{Math.max(0, Math.round(tokenBalance))} BET</div>
          </div>
          <div className="wallet-card">
            <div className="wallet-card__label">Real Balance</div>
            <div className="wallet-card__value">${Math.max(0, Math.round(cashBalance))}</div>
          </div>
        </section>
        <section className="wallet-history">
          <h2>Deposits</h2>
          {(!deposits || !deposits.length) ? (
            <div className="wallet-empty">No deposits yet</div>
          ) : (
            <div className="wallet-list">
              {deposits.map((d) => (
                <div key={d._id} className={`wallet-row wallet-row--${d.status}`}>
                  <div className="wallet-row__main">
                    <div className="wallet-row__title">{d.provider} • {d.currency}</div>
                    <div className="wallet-row__meta">{new Date(d.created_at).toLocaleString()}</div>
                  </div>
                  <div className="wallet-row__amount">${d.amount}</div>
                  <div className="wallet-row__status">
                    {d.status}
                    {SHOW_DEPOSIT_IDS && (
                      <button
                        className="wallet-copy-id"
                        title={d._id}
                        onClick={() => { navigator.clipboard?.writeText(d._id); }}
                      >Copy ID</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <VersionFooter />
    </div>
  );
};

export default Wallet;
