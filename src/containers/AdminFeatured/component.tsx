import React, { useEffect, useState } from 'react';
import '../../styles/admin.scss';
import { createBackendAxiosRequest } from 'store/requests';
import { getBearerTokenHeader } from 'store/actionCreators';

const AdminFeatured: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/featured/snapshot', headers: getBearerTokenHeader() });
      setRows((res.data?.items || []).map((x: any) => ({
        id: x.id,
        selected: !!x.selected,
        score: x.score,
        speed: x.game?.speed,
        initMin: x.summary?.initMin,
        maxRating: x.summary?.maxRating,
        white: `${x.game?.players?.white?.name || x.game?.players?.white?.id || ''} (${x.game?.players?.white?.rating || '-'})` ,
        black: `${x.game?.players?.black?.name || x.game?.players?.black?.id || ''} (${x.game?.players?.black?.rating || '-'})` ,
      })));
    } catch (e: any) { setErr(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="admin-content">
      <div className="admin-card" style={{ marginTop: 0 }}>
        <div className="admin-card__title"><span>Featured Candidates</span><button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
        {err && <div style={{ color: '#ef4444' }}>{err}</div>}
        {!!rows.length && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0', color: '#9ca3af' }}>
            {(() => {
              const total = rows.length;
              const avgScore = rows.reduce((s: number, r: any) => s + (Number(r.score) || 0), 0) / Math.max(1, total);
              const speeds: Record<string, number> = {};
              for (const r of rows) speeds[String(r.speed || 'unknown')] = (speeds[String(r.speed || 'unknown')] || 0) + 1;
              const speedStr = Object.entries(speeds).map(([k, v]) => `${k}:${v}`).join(' • ');
              const maxElo = Math.max(...rows.map((r: any) => Number(r.maxRating || 0)).filter((n) => Number.isFinite(n)) as any, 0);
              const selected = rows.find((r: any) => r.selected);
              return (
                <>
                  <div>Total: {total}</div>
                  <div>Avg score: {Number.isFinite(avgScore) ? avgScore.toFixed(2) : '—'}</div>
                  <div>Speeds: {speedStr || '—'}</div>
                  <div>Max Elo: {Number.isFinite(maxElo) ? maxElo : '—'}</div>
                  <div>Selected: {selected?.id || '—'}</div>
                </>
              );
            })()}
          </div>
        )}
        {!rows.length ? (
          <div style={{ opacity: 0.7 }}>No recent selection snapshot</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Game</th>
                <th style={{ textAlign: 'right' }}>Score</th>
                <th>Speed</th>
                <th style={{ textAlign: 'right' }}>Time (min)</th>
                <th style={{ textAlign: 'right' }}>Max Elo</th>
                <th>White</th>
                <th>Black</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.selected ? '★' : ''}</td>
                  <td>{r.id}</td>
                  <td style={{ textAlign: 'right' }}>{typeof r.score === 'number' ? r.score.toFixed(2) : '—'}</td>
                  <td>{r.speed}</td>
                  <td style={{ textAlign: 'right' }}>{r.initMin}</td>
                  <td style={{ textAlign: 'right' }}>{r.maxRating}</td>
                  <td>{r.white}</td>
                  <td>{r.black}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminFeatured;

