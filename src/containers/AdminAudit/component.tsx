import React, { useEffect, useState } from 'react';
import '../../styles/admin.scss';
import { getAdminAudit } from 'store/requests/adminRequests';

const AdminAudit: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [since, setSince] = useState('');
  const [limit, setLimit] = useState(50);
  const [skip, setSkip] = useState(0);
  const [query, setQuery] = useState('');

  const exportCsv = async () => {
    try {
      const res = await getAdminAudit({ actor: actor.trim() || undefined, action: action.trim() || undefined, since: since.trim() || undefined, limit: Math.max(50, limit), skip });
      const data = res.entries || [];
      const headers = ['ts','actor','action','target','details'];
      const lines = [headers.join(',')];
      for (const r of data) {
        const vals = [r.ts, r.actor, r.action, r.target, r.details].map((v) => {
          const s = v == null ? '' : String(v);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        });
        lines.push(vals.join(','));
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'admin_audit.csv'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await getAdminAudit({ actor: actor.trim() || undefined, action: action.trim() || undefined, since: since.trim() || undefined, q: query.trim() || undefined, limit, skip });
      setRows(res.entries || []);
    } catch (e: any) { setErr(e?.message || 'Failed to load audit'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="admin-content">
      <div className="admin-card" style={{ marginTop: 0 }}>
        <div className="admin-card__title"><span>Audit Trail</span><button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <input placeholder="Actor (email)" value={actor} onChange={(e) => setActor(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
          <input placeholder="Action (e.g. withdrawal.approve)" value={action} onChange={(e) => setAction(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', minWidth: 260 }} />
          <input placeholder="Since (ISO date)" value={since} onChange={(e) => setSince(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
          <input placeholder="Search (actor/action/target/details)" value={query} onChange={(e) => setQuery(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', minWidth: 240 }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => { setSkip(0); load(); }} disabled={loading}>Apply</button>
            <button onClick={exportCsv} disabled={loading || !rows.length}>Export CSV</button>
          </div>
        </div>
        {err && <div style={{ color: '#ef4444' }}>{err}</div>}
        {!rows.length ? (
          <div style={{ opacity: 0.7 }}>No audit entries yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.ts ? new Date(r.ts).toLocaleString() : '—'}</td>
                  <td>{r.actor}</td>
                  <td>{r.action}</td>
                  <td>{r.target}</td>
                  <td>{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button disabled={loading || skip === 0} onClick={() => { const next = Math.max(0, skip - limit); setSkip(next); setTimeout(load, 0); }}>Prev</button>
          <button disabled={loading || rows.length < limit} onClick={() => { const next = skip + limit; setSkip(next); setTimeout(load, 0); }}>Next</button>
          <span style={{ opacity: 0.7 }}>Showing {rows.length} rows</span>
          <label style={{ marginLeft: 'auto' }}>Limit <input type="number" min={10} max={200} value={limit} onChange={(e) => setLimit(Math.max(10, Math.min(200, Number(e.target.value || 50))))} style={{ width: 80 }} /></label>
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;

