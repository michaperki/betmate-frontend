import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/admin.scss';
import { adminGetUserLedger } from 'store/requests/adminRequests';

function useQuery() {
  return useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
}

const AdminUsersLedger: React.FC = () => {
  const q = useQuery();
  const [userId, setUserId] = useState<string>(q.get('id') || '');
  const [currency, setCurrency] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await adminGetUserLedger(userId, { currency: (currency as any) || undefined, limit: 100 });
      setRows(res.items || []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load ledger');
    } finally { setLoading(false); }
  };

  useEffect(() => { /* no-op */ }, []);

  const exportCsv = () => {
    try {
      const headers = ['created_at','currency','amount','reason','reference_type','reference_id'];
      const lines = [headers.join(',')];
      for (const r of rows) {
        const line = [r.created_at, r.currency, r.amount, r.reason, r.reference_type || '', r.reference_id || '']
          .map((v) => {
            const s = v == null ? '' : String(v);
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          }).join(',');
        lines.push(line);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_${userId || 'unknown'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="admin-content">
      <div className="admin-card" style={{ marginTop: 0 }}>
        <div className="admin-card__title"><span>User Ledger</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', minWidth: 320 }} />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="">All</option>
            <option value="USDT">USDT</option>
            <option value="BET">BET</option>
          </select>
          <button onClick={load} disabled={loading || !userId}>{loading ? 'Loading…' : 'Load'}</button>
          <a href="/admin/users/search" style={{ marginLeft: 'auto', color: '#9ca3af', textDecoration: 'none' }}>← Back to search</a>
          <button onClick={exportCsv} disabled={!rows.length} style={{ marginLeft: 12 }}>Export CSV</button>
          {err && <span style={{ color: '#ef4444' }}>{err}</span>}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        {!rows.length ? (
          <div style={{ opacity: 0.7 }}>No ledger entries</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Currency</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Reason</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.currency}</td>
                  <td style={{ textAlign: 'right' }}>{r.currency === 'USDT' ? `$${Number(r.amount || 0).toFixed(2)}` : Number(r.amount || 0)}</td>
                  <td>{r.reason}</td>
                  <td>{r.reference_type ? `${r.reference_type}:${r.reference_id || ''}` : (r.reference_id || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsersLedger;
