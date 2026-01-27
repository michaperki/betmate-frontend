import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import { RootState } from 'types/state';
import { createDepositIntent, listDeposits, getDepositQuote, faucetCredit, listWithdrawals as listMyWithdrawals, requestWithdrawal, startKycMock, cancelWithdrawal } from 'store/requests/billingRequests';
import * as authRequests from 'store/requests/authRequests';
import { JWT_SIGN_IN } from 'types/resources/auth';
import { ENABLE_REAL_DEPOSITS, PAYMENT_SUCCESS_URL, PAYMENT_CANCEL_URL, SHOW_DEPOSIT_IDS } from 'utils/config';
import { useMode } from 'context/ModeContext';
import './style.scss';
import { currencyLongName, formatAmountShort } from 'utils/currency';

interface DepositItem {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  provider: string;
  provider_ref?: string;
  created_at: string;
  metadata?: { payment_url?: string; [k: string]: any };
}

const Wallet: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(25);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [payCurrency, setPayCurrency] = useState<string>('USDTTRC20');
  const [wdCurrency, setWdCurrency] = useState<string>('USDTTRC20');
  const [wdMethod, setWdMethod] = useState<'crypto'|'manual'>('crypto');
  const [quote, setQuote] = useState<{ charge_usd: number; fee_usd: number; estimated_pay_amount: number } | null>(null);
  const [wdAmount, setWdAmount] = useState<number>(25);
  const [wdAddress, setWdAddress] = useState<string>('');
  const [wdHandle, setWdHandle] = useState<string>('');
  const { faucetEnabled, withdrawEnabled, requireKyc } = useMode();

  const tokenBalance = user?.token_balance ?? 0;
  const cashBalance = (user as any)?.cash_balance ?? 0;

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setDeposits([]); return; }
    setErr(null);
    try {
      const res = await listDeposits();
      const arr = (res?.data?.deposits || []) as DepositItem[];
      setDeposits(arr);
      try {
        const wr = await listMyWithdrawals();
        const wArr = (wr?.data?.withdrawals || []) as any[];
        setWithdrawals(wArr);
      } catch {}
    } catch (e: any) {
      setErr('Failed to load deposit history');
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);

  // Fetch quote when amount or currency changes
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const amt = Math.max(5, Math.min(10000, Number(amount || 0)));
        const res = await getDepositQuote(amt, payCurrency);
        if (!active) return;
        const data = res?.data;
        setQuote({ charge_usd: data?.charge_usd || amt, fee_usd: data?.fee_usd || 0, estimated_pay_amount: data?.estimated_pay_amount || 0 });
      } catch { setQuote(null); }
    })();
    return () => { active = false; };
  }, [amount, payCurrency]);

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
      const res = await createDepositIntent(amt, payCurrency);
      const hosted = res?.data?.hosted_url || '#';
      if (hosted && hosted !== '#') window.open(hosted, '_blank');
      await refresh();
    } catch (e: any) {
      setErr('Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  const onStartKyc = async () => {
    setLoading(true);
    setErr(null);
    try {
      await startKycMock();
      const res = await authRequests.jwtSignIn();
      const user = res?.data?.user;
      if (user) dispatch({ type: JWT_SIGN_IN, payload: { user }, status: 'SUCCESS' } as any);
      setBanner('KYC started (mock). An admin will approve you shortly.');
    } catch (e) {
      setErr('Failed to start KYC');
    } finally {
      setLoading(false);
    }
  };

  const onWithdraw = async () => {
    if (!isAuthenticated) { setErr('Sign in to withdraw'); return; }
    setLoading(true);
    setErr(null);
    try {
      const amt = Math.max(5, Math.min(10000, Number(wdAmount || 0)));
      if (wdMethod === 'manual') {
        const h = wdHandle.trim();
        if (!h) throw new Error('Missing handle');
        await requestWithdrawal(amt, 'USD', h, 'manual', h);
      } else {
        await requestWithdrawal(amt, wdCurrency, wdAddress.trim());
      }
      setBanner('Withdrawal requested. It will appear below and await admin approval.');
      setWdAddress('');
      setWdHandle('');
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const onFaucet = async (amt: number) => {
    if (!isAuthenticated) { setErr('Sign in to use faucet'); return; }
    setLoading(true);
    setErr(null);
    try {
      await faucetCredit(amt);
      // Refresh user from backend so cash_balance updates in UI
      const res = await authRequests.jwtSignIn();
      const user = res?.data?.user;
      if (user) dispatch({ type: JWT_SIGN_IN, payload: { user }, status: 'SUCCESS' } as any);
      setBanner(`Faucet credited $${amt}.`);
    } catch (e) {
      setErr('Faucet failed');
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
              <select
                className="wallet-amount-input"
                aria-label="Pay currency"
                value={payCurrency}
                onChange={(e) => setPayCurrency(e.target.value)}
                style={{ width: 160 }}
              >
                <option value="USDTTRC20">USDT (TRC20)</option>
                <option value="USDTBEP20">USDT (BEP20)</option>
                <option value="USDTERC20">USDT (ERC20)</option>
                <option value="USDC">USDC</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
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
                {loading ? 'Starting…' : `Add $${Math.max(5, Math.min(10000, Number(amount || 0)))}`}
              </button>
              {(faucetEnabled === true) && (
                <button
                  className="wallet-deposit-btn"
                  style={{ background: '#0f766e', borderColor: '#0f766e' }}
                  onClick={() => onFaucet(250)}
                  disabled={loading || !isAuthenticated}
                  title="Dev faucet (credits your Real balance for testing)"
                  data-testid="wallet-faucet-btn"
                >
                  Faucet +$250
                </button>
              )}
            </div>
          ) : (
            <div className="wallet-disabled">Real deposits are disabled</div>
          )}
        </header>
        {ENABLE_REAL_DEPOSITS && (
          <div className="wallet-hint">
            {quote ? (
              <>
                You’ll pay approximately <b>{quote.estimated_pay_amount.toFixed(6)} {payCurrency}</b> (~${quote.charge_usd.toFixed(2)} incl. fees ~${quote.fee_usd.toFixed(2)}).
                {' '}Supported: USDT (TRC20/BEP20/ERC20), USDC, BTC, ETH. Tip: TRC20/BEP20 confirm fast with low fees; ERC20/BTC/ETH may cost more and take longer.
              </>
            ) : (
              <>Redirects: <code>{PAYMENT_SUCCESS_URL}</code> (success), <code>{PAYMENT_CANCEL_URL}</code> (cancel)</>
            )}
          </div>
        )}
        {err && <div className="wallet-error">{err}</div>}
        <section className="wallet-balances">
          <div className="wallet-card">
            <div className="wallet-card__label">{currencyLongName('BET')} Balance</div>
            <div className="wallet-card__value">{formatAmountShort(tokenBalance, 'BET')}</div>
          </div>
          <div className="wallet-card">
            <div className="wallet-card__label">{currencyLongName('USDT')} Balance</div>
            <div className="wallet-card__value">{formatAmountShort(cashBalance, 'USDT')}</div>
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
                    <div className="wallet-row__title">
                      {d.provider} • {d.currency}
                      {d.provider_ref ? <span style={{ marginLeft: 8, color: '#6B7280', fontSize: 12 }}>#{d.provider_ref}</span> : null}
                    </div>
                    <div className="wallet-row__meta">{new Date(d.created_at).toLocaleString()}</div>
                  </div>
                  <div className="wallet-row__amount">${d.amount}</div>
                  <div className="wallet-row__status">
                    {d.status}
                    {(d.provider === 'nowpayments' && d.status === 'pending' && d.metadata?.payment_url && d.metadata.payment_url !== '#') && (
                      <button
                        className="wallet-link-btn"
                        style={{ marginLeft: 8 }}
                        onClick={() => window.open(String(d.metadata?.payment_url), '_blank')}
                      >Open Invoice</button>
                    )}
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
        <section className="wallet-history" style={{ marginTop: 24 }}>
          <h2>Withdrawals</h2>
          <div className="wallet-hint" style={{ marginBottom: 8 }}>
            KYC Status: <b>{String((user as any)?.kyc_status || 'none')}</b>
          </div>
          {withdrawEnabled === false && (
            <div className="wallet-disabled" style={{ marginBottom: 8 }}>Withdrawals are currently disabled.</div>
          )}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="wallet-amount-input"
              aria-label="Withdraw method"
              value={wdMethod}
              onChange={(e) => setWdMethod(e.target.value === 'manual' ? 'manual' : 'crypto')}
              style={{ width: 160 }}
            >
              <option value="crypto">Crypto</option>
              <option value="manual">Manual (Venmo)</option>
            </select>
            <select
              className="wallet-amount-input"
              aria-label="Withdraw currency"
              value={wdMethod === 'manual' ? 'USD' : wdCurrency}
              onChange={(e) => setWdCurrency(e.target.value)}
              style={{ width: 160 }}
              disabled={wdMethod === 'manual'}
            >
              <option value="USDTTRC20">USDT (TRC20)</option>
              <option value="USDTBEP20">USDT (BEP20)</option>
              <option value="USDTERC20">USDT (ERC20)</option>
              <option value="USDC">USDC</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
            <input
              type="number"
              min={5}
              max={10000}
              step={5}
              value={wdAmount}
              onChange={(e) => setWdAmount(Number(e.target.value))}
              className="wallet-amount-input"
              aria-label="Withdraw amount"
            />
            {wdMethod === 'manual' ? (
              <input
                type="text"
                value={wdHandle}
                onChange={(e) => setWdHandle(e.target.value)}
                placeholder="Venmo handle (e.g., @username)"
                className="wallet-amount-input"
                style={{ width: 360 }}
              />
            ) : (
              <input
                type="text"
                value={wdAddress}
                onChange={(e) => setWdAddress(e.target.value)}
                placeholder="Destination address"
                className="wallet-amount-input"
                style={{ width: 360 }}
              />
            )}
            {((user as any)?.kyc_status === 'approved') ? (
              <button className="wallet-deposit-btn" onClick={onWithdraw} disabled={loading || !isAuthenticated || (wdMethod === 'manual' ? !wdHandle : !wdAddress) || withdrawEnabled === false}>
                {loading ? 'Submitting…' : `Withdraw $${Math.max(5, Math.min(10000, Number(wdAmount || 0)))}`}
              </button>
            ) : (
              <button className="wallet-deposit-btn" style={{ background: '#4b5563', borderColor: '#4b5563' }} onClick={onStartKyc} disabled={loading || !isAuthenticated}>
                {loading ? 'Starting…' : 'Start Mock Verification'}
              </button>
            )}
          </div>
          {(!withdrawals || !withdrawals.length) ? (
            <div className="wallet-empty">No withdrawals yet</div>
          ) : (
            <div className="wallet-list">
              {withdrawals.map((w) => (
                <div key={w._id} className={`wallet-row wallet-row--${w.status}`}>
                  <div className="wallet-row__main">
                    <div className="wallet-row__title">{w.currency} • {w.status}</div>
                    <div className="wallet-row__meta">{new Date(w.created_at).toLocaleString()}</div>
                  </div>
                  <div className="wallet-row__amount">${w.amount}</div>
                  <div className="wallet-row__status">
                    {(w.address || '').slice(0, 16)}…
                    {(w.status === 'requested') && (
                      <button
                        className="wallet-link-btn"
                        style={{ marginLeft: 8 }}
                        onClick={async () => { try { await cancelWithdrawal(w._id); refresh(); } catch { alert('Cancel failed'); } }}
                      >
                        Cancel
                      </button>
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
