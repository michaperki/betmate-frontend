import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import { RootState } from 'types/state';
import { createDepositIntent, listDeposits } from 'store/requests/billingRequests';
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
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

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

  const onDeposit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await createDepositIntent(25, 'USDT');
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
          <button className="wallet-deposit-btn" onClick={onDeposit} disabled={loading || !isAuthenticated}>
            {loading ? 'Starting…' : 'Add USDT'}
          </button>
        </header>
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
                  <div className="wallet-row__status">{d.status}</div>
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

