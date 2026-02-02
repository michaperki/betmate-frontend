import React, { useEffect, useState } from 'react';
import '../../styles/admin.scss';
import { getAdminAudit } from 'store/requests/adminRequests';
import Toolbar from '../../admin/components/Toolbar';
import DataTable from '../../admin/components/DataTable';

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
    } catch (e: any) {
      setErr(e?.message || 'Failed to load audit');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="admin-content">
        <div className="admin-card" style={{ marginTop: 0 }}>
        <div className="admin-card__title"><span>Audit Trail</span><button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
        <Toolbar
          left={(
            <>
              <input placeholder="Actor (email)" value={actor} onChange={(e) => setActor(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
              <input placeholder="Action (e.g. withdrawal.approve)" value={action} onChange={(e) => setAction(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', minWidth: 260 }} />
              <input placeholder="Since (ISO date)" value={since} onChange={(e) => setSince(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
              <input placeholder="Search (actor/action/target/details)" value={query} onChange={(e) => setQuery(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', minWidth: 240 }} />
            </>
          )}
          right={(
            <>
              <button onClick={() => { setSkip(0); load(); }} disabled={loading}>Apply</button>
              <button onClick={exportCsv} disabled={loading || !rows.length}>Export CSV</button>
            </>
          )}
        />

        {/* Quick action filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
          {['feature.update','risk.update','risk.preset','withdrawal.approve','withdrawal.paid','withdrawal.failed','kyc.approve','kyc.reject','payments.reconcile.deposits','payments.reconcile.payouts','invite.create','invite.bulk_create','invite.update','invite.delete','email.resend_verification','email.invites.bulk'].map((a) => (
            <button key={a} onClick={() => { setAction(a); setSkip(0); setTimeout(load, 0); }} style={{ fontSize: 12, padding: '4px 8px' }}>{a}</button>
          ))}
          {action && <button onClick={() => { setAction(''); setSkip(0); setTimeout(load, 0); }} style={{ fontSize: 12, padding: '4px 8px' }}>Clear action</button>}
        </div>
        {err && <div style={{ color: '#ef4444' }}>{err}</div>}
        <DataTable
          rows={rows}
          empty="No audit entries yet."
          defaultSortKey="ts"
          defaultSortDir="desc"
          className="admin-table sticky compact"
          columns={[
            { key: 'ts', header: 'Timestamp', sort: (a: any, b: any) => new Date(a.ts || 0).getTime() - new Date(b.ts || 0).getTime(), render: (r: any) => (r.ts ? new Date(r.ts).toLocaleString() : '—') },
            { key: 'actor', header: 'Actor', sort: true },
            { key: 'action', header: 'Action', sort: true },
            { key: 'target', header: 'Target' },
            { key: 'details', header: 'Details' },
          ]}
        />
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
