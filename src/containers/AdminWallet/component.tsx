import React, { useEffect, useMemo, useState } from 'react';
import { getAdminDeposits, clearStaleInvoices, getAdminWithdrawals, approveWithdrawal, rejectWithdrawal, markWithdrawalPaid, markWithdrawalProcessing, markWithdrawalFailed, reconcileNowpaymentsDeposits, reconcileNowpaymentsPayouts, reissueNowpaymentsInvoice } from 'store/requests/adminRequests';
import '../../styles/admin.scss';
import DataTable from '../../admin/components/DataTable';
import Toolbar from '../../admin/components/Toolbar';
import StatusBadge from '../../admin/components/StatusBadge';

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
  const [tab, setTab] = useState<'deposits'|'withdrawals'|'recon'>('deposits');
  const [status, setStatus] = useState<string>('');
  const [since, setSince] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);
  const [rows, setRows] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [depSkip, setDepSkip] = useState<number>(0);
  const [confirmText, setConfirmText] = useState('');
  // Withdrawals
  const [wStatus, setWStatus] = useState<string>('');
  const [wRows, setWRows] = useState<any[]>([]);
  const [wLoading, setWLoading] = useState(false);
  const [wErr, setWErr] = useState<string | null>(null);
  const [wSkip, setWSkip] = useState<number>(0);
  // Reconciliation
  const [reconLimit, setReconLimit] = useState<number>(20);
  const [reconBusy, setReconBusy] = useState(false);
  const [reconLog, setReconLog] = useState<string>('');
  const [reconDepResults, setReconDepResults] = useState<any[]>([]);
  const [reconPayoutResults, setReconPayoutResults] = useState<any[]>([]);
  const [reissueId, setReissueId] = useState<string>('');
  const [reissueForce, setReissueForce] = useState<boolean>(false);
  const [reconDry, setReconDry] = useState<boolean>(true);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await getAdminDeposits({ status, since, limit, skip: depSkip });
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
      const data = await getAdminWithdrawals({ status: wStatus, since, limit, skip: wSkip });
      setWRows(data.withdrawals || []);
    } catch (e: any) {
      setWErr(e?.message || 'Failed to load withdrawals');
    } finally {
      setWLoading(false);
    }
  };

  useEffect(() => { refresh(); refreshWithdrawals(); }, []);

  const isProd = typeof process !== 'undefined' && (process as any).env && (process as any).env.NODE_ENV === 'production';

  return (
    <div className="admin-content">
      <div style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Admin — Wallet</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setTab('deposits')} style={{ padding: '6px 10px', borderRadius: 6, border: tab==='deposits' ? '1px solid #10b981' : '1px solid #1f2937', background: tab==='deposits' ? 'rgba(16,185,129,0.1)' : 'transparent', color: tab==='deposits' ? '#34d399' : '#9ca3af' }}>Deposits</button>
            <button onClick={() => setTab('withdrawals')} style={{ padding: '6px 10px', borderRadius: 6, border: tab==='withdrawals' ? '1px solid #10b981' : '1px solid #1f2937', background: tab==='withdrawals' ? 'rgba(16,185,129,0.1)' : 'transparent', color: tab==='withdrawals' ? '#34d399' : '#9ca3af' }}>Withdrawals</button>
            <button onClick={() => setTab('recon')} style={{ padding: '6px 10px', borderRadius: 6, border: tab==='recon' ? '1px solid #10b981' : '1px solid #1f2937', background: tab==='recon' ? 'rgba(16,185,129,0.1)' : 'transparent', color: tab==='recon' ? '#34d399' : '#9ca3af' }}>Reconciliation</button>
            <button onClick={() => { refresh(); refreshWithdrawals(); }} disabled={loading || wLoading} style={{ marginLeft: 8 }}>{(loading || wLoading) ? 'Refreshing…' : 'Refresh'}</button>
          </div>
        </div>
        {tab === 'deposits' && (
          <>
            <div className="admin-card" style={{ marginTop: 12 }}>
              <div className="admin-card__title"><span>Deposits</span><span /></div>
              <Toolbar
                left={(
                  <>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} />
                    <input type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
                  </>
                )}
                right={(
                  <>
                    <button onClick={() => { setDepSkip(0); refresh(); }} disabled={loading}>Apply</button>
                  </>
                )}
              />
              {err && <div style={{ color: '#b91c1c', marginTop: 8 }}>{err}</div>}
            </div>
            <div className="admin-card" style={{ marginTop: 16 }}>
              <DataTable
                rows={rows as any}
                empty="No deposits found"
                defaultSortKey="created_at"
                defaultSortDir="desc"
                className="admin-table sticky compact"
                columns={[
                  { key: 'created_at', header: 'Created', sort: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(), render: (d: any) => new Date(d.created_at).toLocaleString() },
                  { key: 'provider', header: 'Provider', render: (d: any) => `${d.provider} • ${d.currency}` },
                  { key: 'amount', header: 'Amount', align: 'right', sort: true, render: (d: any) => `$${d.amount}` },
                  { key: 'status', header: 'Status', sort: true, render: (d: any) => <StatusBadge status={d.status} /> },
                  { key: 'refs', header: 'Refs', render: (d: any) => (
                    <div>
                      {d.provider_ref && <div>ref: <code>{d.provider_ref}</code></div>}
                      {d.metadata?.payment_url && <a className="admin-link" href={String(d.metadata.payment_url)} target="_blank" rel="noreferrer">invoice</a>}
                    </div>
                  ) },
                ]}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button disabled={loading || depSkip === 0} onClick={() => { const next = Math.max(0, depSkip - limit); setDepSkip(next); setTimeout(refresh, 0); }}>Prev</button>
                <button disabled={loading || rows.length < limit} onClick={() => { const next = depSkip + limit; setDepSkip(next); setTimeout(refresh, 0); }}>Next</button>
                <span style={{ opacity: 0.7 }}>Showing {rows.length} rows</span>
              </div>
            </div>
          </>
        )}

        {tab === 'withdrawals' && (
          <>
            <div className="admin-card" style={{ marginTop: 12 }}>
              <div className="admin-card__title"><span>Withdrawals</span><span /></div>
              <Toolbar
                left={(
                  <>
                    <select value={wStatus} onChange={(e) => setWStatus(e.target.value)}>
                      <option value="">All</option>
                      <option value="requested">Requested</option>
                      <option value="approved">Approved</option>
                      <option value="processing">Processing</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                      <option value="failed">Failed</option>
                    </select>
                  </>
                )}
                right={(
                  <>
                    <button onClick={() => { setWSkip(0); refreshWithdrawals(); }} disabled={wLoading}>Apply</button>
                  </>
                )}
              />
              {wErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{wErr}</div>}
            </div>
            <div className="admin-card" style={{ marginTop: 12 }}>
              <DataTable
                rows={wRows as any}
                empty="No withdrawals found"
                defaultSortKey="created_at"
                defaultSortDir="desc"
                className="admin-table sticky compact"
                columns={[
                  { key: 'created_at', header: 'Created', sort: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(), render: (w: any) => new Date(w.created_at).toLocaleString() },
                  { key: 'amount', header: 'Amount', align: 'right', sort: true, render: (w: any) => `${w.currency} $${w.amount}` },
                  { key: 'status', header: 'Status', sort: true, render: (w: any) => <StatusBadge status={w.status} /> },
                  { key: 'address', header: 'Address', render: (w: any) => <span style={{ maxWidth: 260, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.address}</span> },
                  { key: 'actions', header: 'Actions', render: (w: any) => (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button disabled={wLoading} onClick={async () => { await approveWithdrawal(w._id); refreshWithdrawals(); }}>Approve</button>
                      <button disabled={wLoading} onClick={async () => { await rejectWithdrawal(w._id); refreshWithdrawals(); }}>Reject</button>
                      <button disabled={wLoading} onClick={async () => { await markWithdrawalProcessing(w._id); refreshWithdrawals(); }}>Processing</button>
                      <button disabled={wLoading} onClick={async () => { await markWithdrawalPaid(w._id); refreshWithdrawals(); }}>Mark Paid</button>
                      <button disabled={wLoading} onClick={async () => { await markWithdrawalFailed(w._id); refreshWithdrawals(); }}>Mark Failed</button>
                    </div>
                  ) },
                  { key: 'provider_ref', header: 'Ref', render: (w: any) => (w.provider_ref ? <code>{w.provider_ref}</code> : '-') },
                ]}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button disabled={wLoading || wSkip === 0} onClick={() => { const next = Math.max(0, wSkip - limit); setWSkip(next); setTimeout(refreshWithdrawals, 0); }}>Prev</button>
                <button disabled={wLoading || wRows.length < limit} onClick={() => { const next = wSkip + limit; setWSkip(next); setTimeout(refreshWithdrawals, 0); }}>Next</button>
                <span style={{ opacity: 0.7 }}>Showing {wRows.length} rows</span>
              </div>
            </div>
          </>
        )}

        {tab === 'recon' && (
            <div className="admin-card" style={{ marginTop: 16 }}>
              <div className="admin-card__title">Payments Reconciliation</div>
              <p style={{ color: '#9ca3af' }}>Run provider polls to reconcile pending deposits and payouts. Use cautiously in production. Actions require admin credentials and will log changes on the server.</p>
            <Toolbar
              left={(
                <>
                  <label>Limit <input type="number" min={1} max={100} value={reconLimit} onChange={(e) => setReconLimit(Number(e.target.value || 20))} style={{ width: 80 }} /></label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={reconDry} onChange={(e) => setReconDry(e.target.checked)} /> Dry run
                  </label>
                </>
              )}
              right={(
                <>
                  <button disabled={reconBusy || isProd} title={isProd ? 'Disabled in production' : undefined} onClick={async () => {
                    if (!window.confirm('Reconcile NOWPayments deposits?')) return;
                    setReconBusy(true);
                    try {
                      const res = await reconcileNowpaymentsDeposits(reconLimit, { dryRun: reconDry });
                      setReconDepResults(res?.results || []);
                    } finally { setReconBusy(false); }
                  }}>Reconcile Deposits</button>
                  <button disabled={reconBusy || isProd} title={isProd ? 'Disabled in production' : undefined} onClick={async () => {
                    if (!window.confirm('Reconcile NOWPayments payouts?')) return;
                    setReconBusy(true);
                    try {
                      const res = await reconcileNowpaymentsPayouts(reconLimit, { dryRun: reconDry });
                      setReconPayoutResults(res?.results || []);
                    } finally { setReconBusy(false); }
                  }}>Reconcile Payouts</button>
                </>
              )}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="Reissue deposit id" value={reissueId} onChange={(e) => setReissueId(e.target.value)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={reissueForce} onChange={(e) => setReissueForce(e.target.checked)} /> Force
              </label>
              <button disabled={!reissueId || reconBusy || isProd} title={isProd ? 'Disabled in production' : undefined} onClick={async () => {
                if (!reissueId) return;
                if (!window.confirm(`Reissue invoice ${reissueId}?`)) return;
                setReconBusy(true);
                try { const res = await reissueNowpaymentsInvoice(reissueId, reissueForce); setReconLog(prev => prev + '\nReissue: ' + JSON.stringify(res)); } finally { setReconBusy(false); }
              }}>Reissue Invoice</button>
            </div>
            {isProd && (
              <div style={{ marginTop: 8, color: '#f59e0b', fontSize: 12 }}>Reconciliation actions are disabled in production.</div>
            )}
            {(reconDepResults.length > 0 || reconPayoutResults.length > 0) && (
              <div className="admin-card" style={{ marginTop: 12, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Summary</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                  {(() => {
                    const listD: any[] = reconDepResults as any[];
                    const listP: any[] = reconPayoutResults as any[];
                    const total = listD.length + listP.length;
                    const confirmed = listD.filter((r) => r.status === 'confirmed').length;
                    const paid = listP.filter((r) => r.status === 'paid').length;
                    const failed = listD.filter((r) => r.status === 'failed').length + listP.filter((r) => r.status === 'failed').length;
                    const errors = listD.filter((r) => !!r.error).length + listP.filter((r) => !!r.error).length;
                    return `Total items: ${total} • confirmed: ${confirmed} • paid: ${paid} • failed: ${failed} • errors: ${errors}${reconDry ? ' • dry-run' : ''}`;
                  })()}
                </div>
              </div>
            )}
            {reconDepResults.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Deposit reconcile results</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
                  {(() => {
                    const total = reconDepResults.length;
                    const ok = reconDepResults.filter((r: any) => r.status === 'confirmed').length;
                    const fail = reconDepResults.filter((r: any) => r.status === 'failed').length;
                    const unchanged = reconDepResults.filter((r: any) => !r.status && !r.error).length;
                    const errors = reconDepResults.filter((r: any) => !!r.error).length;
                    return `Total: ${total} • confirmed: ${ok} • failed: ${fail} • unchanged: ${unchanged} • errors: ${errors}${reconDry ? ' • dry-run' : ''}`;
                  })()}
                </div>
                <DataTable
                  rows={reconDepResults as any}
                  empty="No results"
                  columns={[
                    { key: 'id', header: 'Deposit Id' },
                    { key: 'provider_ref', header: 'Provider Ref' },
                    { key: 'status', header: 'Status', render: (r: any) => r.status ? <StatusBadge status={r.status} /> : '—' },
                    { key: 'error', header: 'Error' },
                  ]}
                />
              </div>
            )}
            {reconPayoutResults.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Payout reconcile results</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
                  {(() => {
                    const total = reconPayoutResults.length;
                    const paid = reconPayoutResults.filter((r: any) => r.status === 'paid').length;
                    const fail = reconPayoutResults.filter((r: any) => r.status === 'failed').length;
                    const unchanged = reconPayoutResults.filter((r: any) => !r.status && !r.error).length;
                    const errors = reconPayoutResults.filter((r: any) => !!r.error).length;
                    return `Total: ${total} • paid: ${paid} • failed: ${fail} • unchanged: ${unchanged} • errors: ${errors}${reconDry ? ' • dry-run' : ''}`;
                  })()}
                </div>
                <DataTable
                  rows={reconPayoutResults as any}
                  empty="No results"
                  columns={[
                    { key: 'id', header: 'Withdrawal Id' },
                    { key: 'provider_ref', header: 'Provider Ref' },
                    { key: 'status', header: 'Status', render: (r: any) => r.status ? <StatusBadge status={r.status} /> : '—' },
                    { key: 'error', header: 'Error' },
                  ]}
                />
              </div>
            )}
            {!!reconLog && (
              <pre style={{ marginTop: 12, padding: 12, background: '#0b0b0b', border: '1px solid #1f2937', borderRadius: 6, maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{reconLog}</pre>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, padding: 12, border: '1px solid #1f2937', borderRadius: 6 }}>
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
