import React, { useEffect, useState } from 'react';
import { getOpsStats, pingMicroservice, getOpsLatencySample, getOpsRuntime } from 'store/requests/adminRequests';
import LineChart from '../../admin/components/LineChart';
import '../../styles/admin.scss';

const AdminOps: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [ping, setPing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<Array<{ ts: number; db: number | null; micro: number | null }>>([]);
  const [runtime, setRuntime] = useState<any>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await getOpsStats();
      setStats(s);
      try { setRuntime(await getOpsRuntime()); } catch {}
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  // Poll latency sample every 30s to build a local session chart
  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const s = await getOpsLatencySample();
        if (!mounted) return;
        setSamples(prev => {
          const next = [...prev, { ts: s.ts, db: s.db?.ms ?? null, micro: s.microservice?.ms ?? null }];
          return next.slice(-24); // keep last ~12 minutes (24x30s)
        });
      } catch {}
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => { mounted = false; window.clearInterval(id); };
  }, []);

  const doPing = async () => {
    const res = await pingMicroservice();
    setPing(res);
  };

  return (
    <div className="admin-content">
      <div style={{ padding: 0 }}>
        <div className="admin-card" style={{ marginTop: 0 }}>
          <div className="admin-card__title">
            <span>Operational Health</span>
            <button onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 240 }}>
              <div className="admin-row"><span>DB</span><span>{stats?.db || '-'}</span></div>
              <div className="admin-row"><span>Rate-limit (analysis)</span><span>{stats?.rateLimitCounters?.analysis429 ?? 0}</span></div>
              <div className="admin-row"><span>Rate-limit (auth)</span><span>{stats?.rateLimitCounters?.auth429 ?? 0}</span></div>
              <div className="admin-row"><span>Rate-limit (deposit intent)</span><span>{stats?.rateLimitCounters?.billingIntent429 ?? 0}</span></div>
            </div>
            <div style={{ minWidth: 240 }}>
              <div className="admin-row"><span>Last ping</span><span>{ping ? `${ping.ok ? 'ok' : 'fail'} in ${ping.ms}ms` : '-'}</span></div>
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

        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-card__title">Latency (session)</div>
          <LineChart
            series={[
              { name: 'DB', color: '#34d399', values: samples.map(s => (s.db ?? 0)) },
              { name: 'Microservice', color: '#60a5fa', values: samples.map(s => (s.micro ?? 0)) },
            ]}
            width={600}
            height={140}
          />
          <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>Each point = 30s sample; built from real-time probes.</div>
        </div>

        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-card__title"><span>Runtime Snapshot</span></div>
          {!runtime ? (
            <div style={{ opacity: 0.7 }}>No data</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <div className="admin-row"><span>Env</span><span>{runtime?.env?.nodeEnv || '-'}</span></div>
                <div className="admin-row"><span>Payments</span><span>{runtime?.env?.paymentsProvider || '-'}</span></div>
                <div className="admin-row"><span>Microservice</span><span>{runtime?.env?.microserviceUrl || '-'}</span></div>
              </div>
              <div>
                <div className="admin-row"><span>Version</span><span>{runtime?.version?.appVersion || '-'}</span></div>
                <div className="admin-row"><span>Commit</span><span>{runtime?.version?.commit || '-'}</span></div>
                <div className="admin-row"><span>Release</span><span>{runtime?.version?.release || '-'}</span></div>
              </div>
              <div>
                <div className="admin-row"><span>Email</span><span>{runtime?.email?.provider || '-'}</span></div>
                <div className="admin-row"><span>Flags</span><span style={{ maxWidth: 240, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{Object.keys(runtime?.features || {}).length} keys</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOps;
