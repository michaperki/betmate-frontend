import React, { useEffect, useState } from 'react';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import { getOpsStats, pingMicroservice } from 'store/requests/adminRequests';
import '../../styles/admin.scss';

const AdminOps: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [ping, setPing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await getOpsStats();
      setStats(s);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const doPing = async () => {
    const res = await pingMicroservice();
    setPing(res);
  };

  return (
    <div className="dashboard-page admin-content">
      <NavBar />
      <div style={{ padding: 24 }}>
        <div className="admin-tabs">
          <a href="/admin">Home</a>
          <a href="/admin/risk">Risk</a>
          <a href="/admin/wallet">Wallet</a>
          <a href="/admin/ops">Ops</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Admin — Ops</h2>
          <button onClick={refresh} disabled={loading} style={{ marginLeft: 'auto' }}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
          <div className="admin-card">
            <div className="admin-card__title">Health</div>
            <div className="admin-row"><span>DB</span><span>{stats?.db || '-'}</span></div>
            <div className="admin-row"><span>Rate-limit (analysis)</span><span>{stats?.rateLimitCounters?.analysis429 ?? 0}</span></div>
            <div className="admin-row"><span>Rate-limit (auth)</span><span>{stats?.rateLimitCounters?.auth429 ?? 0}</span></div>
            <div className="admin-row"><span>Rate-limit (deposit intent)</span><span>{stats?.rateLimitCounters?.billingIntent429 ?? 0}</span></div>
          </div>
          <div className="admin-card">
            <div className="admin-card__title">Microservice</div>
            <div className="admin-row"><span>Last ping:</span><span>{ping ? `${ping.ok ? 'ok' : 'fail'} in ${ping.ms}ms` : '-'}</span></div>
            {ping && (
              <>
                <div className="admin-row"><span>Status code</span><span>{ping.status ?? '-'}</span></div>
                <div className="admin-row"><span>URL</span><span style={{ opacity: 0.9 }}>{ping.url || '-'}</span></div>
              </>
            )}
            <button onClick={doPing}>Ping</button>
          </div>
        </div>
      </div>
      <VersionFooter />
    </div>
  );
};

export default AdminOps;
