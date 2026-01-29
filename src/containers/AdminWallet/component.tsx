import React, { useEffect, useMemo, useState } from 'react';
import Header from 'components/Header';
import { NavLink } from 'react-router-dom';
import { getAdminDeposits, clearStaleInvoices, getAdminWithdrawals, approveWithdrawal, rejectWithdrawal, markWithdrawalPaid, markWithdrawalProcessing, markWithdrawalFailed } from 'store/requests/adminRequests';
import '../../styles/admin.scss';

type DepositItem = {
  _id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: string;
  provider_ref?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  metadata?: Record<string, any>;
};

const AdminWallet: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [since, setSince] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);
  const [rows, setRows] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  // Withdrawals
  const [wStatus, setWStatus] = useState<string>('');
  const [wRows, setWRows] = useState<any[]>([]);
  const [wLoading, setWLoading] = useState(false);
  const [wErr, setWErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await getAdminDeposits({ status, since, limit });
      setRows(data.deposits || []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const refreshWithdrawals = async () => {
    setWLoading(true);
    setWErr(null);
    try {
      const data = await getAdminWithdrawals({ status: wStatus, since, limit });
      setWRows(data.withdrawals || []);
    } catch (e: any) {
      setWErr(e?.message || 'Failed to load withdrawals');
    } finally {
      setWLoading(false);
    }
  };

  useEffect(() => { refresh(); refreshWithdrawals(); }, []);

  return (
    <div className="dashboard-page admin-content">
      <Header />
      <div style={{ padding: 24 }}>
        <div className="admin-tabs">
          <NavLink to="/admin">Home</NavLink>
          <NavLink to="/admin/risk">Risk</NavLink>
          <NavLink to="/admin/wallet">Wallet</NavLink>
          <NavLink to="/admin/kyc">KYC</NavLink>
          <NavLink to="/admin/ops">Ops</NavLink>
          <NavLink to="/admin/invites">Invites</NavLink>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Admin — Wallet</h2>
          <button onClick={() => { refresh(); refreshWithdrawals(); }} disabled={loading || wLoading} style={{ marginLeft: 'auto' }}>{(loading || wLoading) ? 'Refreshing…' : 'Refresh'}</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>
          <input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} />
          <input type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          <button onClick={refresh} disabled={loading}>Apply</button>
        </div>
        {err && <div style={{ color: '#b91c1c', marginTop: 8 }}>{err}</div>}
        <div style={{ marginTop: 16 }}>
          {!rows.length ? (
            <div>No deposits found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>Created</div>
              <div style={{ fontWeight: 600 }}>Provider</div>
              <div style={{ fontWeight: 600 }}>Amount</div>
              <div style={{ fontWeight: 600 }}>Status</div>
              <div style={{ fontWeight: 600 }}>Refs</div>
              {rows.map((d) => (
                <React.Fragment key={d._id}>
                  <div>{new Date(d.created_at).toLocaleString()}</div>
                  <div>{d.provider} • {d.currency}</div>
                  <div>${d.amount}</div>
                  <div>{d.status}</div>
                  <div>
                    {d.provider_ref && <div>ref: <code>{d.provider_ref}</code></div>}
                    {d.metadata?.payment_url && <a className="admin-link" href={String(d.metadata.payment_url)} target="_blank" rel="noreferrer">invoice</a>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Withdrawals</h3>
            <select value={wStatus} onChange={(e) => setWStatus(e.target.value)}>
              <option value="">All</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={refreshWithdrawals} disabled={wLoading}>Apply</button>
          </div>
          {wErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{wErr}</div>}
          <div style={{ marginTop: 12 }}>
            {!wRows.length ? (
              <div>No withdrawals found</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 2fr 1fr', gap: 8 }}>
                <div style={{ fontWeight: 600 }}>Created</div>
                <div style={{ fontWeight: 600 }}>Amount</div>
                <div style={{ fontWeight: 600 }}>Status</div>
                <div style={{ fontWeight: 600 }}>Address</div>
                <div style={{ fontWeight: 600 }}>Actions</div>
                <div style={{ fontWeight: 600 }}>Ref</div>
                {wRows.map((w) => (
                  <React.Fragment key={w._id}>
                    <div>{new Date(w.created_at).toLocaleString()}</div>
                    <div>{w.currency} ${w.amount}</div>
                    <div>{w.status}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.address}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button disabled={wLoading} onClick={async () => { await approveWithdrawal(w._id); refreshWithdrawals(); }}>Approve</button>
                      <button disabled={wLoading} onClick={async () => { await rejectWithdrawal(w._id); refreshWithdrawals(); }}>Reject</button>
                      <button disabled={wLoading} onClick={async () => { await markWithdrawalProcessing(w._id); refreshWithdrawals(); }}>Processing</button>
                      <button disabled={wLoading} onClick={async () => { await markWithdrawalPaid(w._id); refreshWithdrawals(); }}>Mark Paid</button>
                      <button disabled={wLoading} onClick={async () => { await markWithdrawalFailed(w._id); refreshWithdrawals(); }}>Mark Failed</button>
                    </div>
                    <div>{w.provider_ref ? <code>{w.provider_ref}</code> : '-'}</div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>Dev/Staging — Clear stale pending invoices</h3>
          <p style={{ marginTop: 4, color: '#6b7280' }}>Type CLEAR and confirm to mark pending invoices older than N minutes as failed.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Type CLEAR" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            <input type="number" min={5} max={1440} defaultValue={60} id="stale-mins" />
            <button
              disabled={confirmText !== 'CLEAR'}
              onClick={async () => {
                const mins = Number((document.getElementById('stale-mins') as HTMLInputElement).value || '60');
                try {
                  const res = await clearStaleInvoices(mins);
                  alert(`Updated ${res.updated} invoices older than ${res.olderThanMinutes} minutes.`);
                  setConfirmText('');
                  refresh();
                } catch (e) {
                  alert('Failed to clear invoices.');
                }
              }}
            >
              Clear stale
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default AdminWallet;
