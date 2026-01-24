import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { authTokenName } from 'utils';
import { useRequireAuthForNew } from './hooks/useRequireAuthForNew';
import { useNewStatsData } from './hooks/useNewStatsData';
import MockHeader from './MockHeader';

const NewStats: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d'|'30d'|'90d'|'all'>('30d');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const history = useHistory();
  const location = useLocation();
  useRequireAuthForNew();
  const data = useNewStatsData();

  // Fallbacks to keep mock visuals stable
  const totalProfit = useMemo(() => (typeof data.totalProfit === 'number' ? data.totalProfit : 1247.8), [data.totalProfit]);
  const totalWagered = useMemo(() => (typeof data.totalWagered === 'number' ? data.totalWagered : 8934.5), [data.totalWagered]);
  const roi = useMemo(() => (typeof data.roi === 'number' ? data.roi : 13.96), [data.roi]);
  const winRate = useMemo(() => (typeof data.winRate === 'number' ? data.winRate : 54.7), [data.winRate]);
  const profitThisWeek = useMemo(() => (typeof data.profitThisWeek === 'number' ? data.profitThisWeek : 156.4), [data.profitThisWeek]);
  const totalBets = data.totalBets || 342;
  const wonBets = data.wonBets || 187;
  const lostBets = data.lostBets || 155;
  const balanceHistory = (data as any).balanceHistory as any[] | undefined;
  const wagerHistory = (data as any).wagerHistory as any[] | undefined;

  // Build tiny chart data
  const profitSeries = useMemo(() => {
    const hist = Array.isArray(balanceHistory) ? balanceHistory.slice(-{
      '7d': 7, '30d': 30, '90d': 90, 'all': 90
    }[timeRange]) : [];
    if (hist.length < 2) return [] as number[];
    const pts: number[] = [];
    for (let i = 1; i < hist.length; i++) {
      const prev = Number(hist[i - 1]?.balance || 0);
      const cur = Number(hist[i]?.balance || 0);
      pts.push(Math.round((cur - prev) * 100) / 100);
    }
    return pts;
  }, [balanceHistory, timeRange]);

  const betTypeBreakdown = useMemo(() => {
    const list = Array.isArray(wagerHistory) ? wagerHistory : [];
    let move = 0; let wdl = 0;
    for (const w of list) {
      if (w && (w.wdl === true)) wdl += 1; else move += 1;
    }
    const total = Math.max(1, move + wdl);
    return { move, wdl, movePct: Math.round((move / total) * 100), wdlPct: Math.round((wdl / total) * 100) };
  }, [wagerHistory]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', fontFamily: "'JetBrains Mono','SF Mono',monospace", color: '#e8e8e8', position: 'relative' }}>
      <MockHeader active="Stats" />

      <main style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Statistics</h1>
            <p style={{ fontSize: 14, opacity: 0.5, margin: 0 }}>Deep dive into your betting performance</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10 }}>
            {(['7d','30d','90d','all'] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)} style={{ padding: '8px 16px', background: timeRange === r ? 'rgba(34,197,94,0.15)' : 'transparent', border: timeRange === r ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent', borderRadius: 8, color: timeRange === r ? '#22c55e' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{r.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Top Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 12 }}>Total Profit</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>+${totalProfit.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#22c55e' }}>↑ {Math.abs(profitThisWeek).toFixed(2)} this week</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 12 }}>ROI</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{roi}%</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>${totalWagered.toLocaleString()} wagered</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 12 }}>Win Rate</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{winRate}%</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>{wonBets} won · {lostBets} lost</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 12 }}>Total Bets</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{totalBets}</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>Across all markets</div>
          </div>
        </div>

        {/* Placeholder sections (charts/tables) remain visual-only for now */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, minHeight: 220 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 12 }}>Profit Over Time</div>
            {profitSeries.length === 0 ? (
              <div style={{ opacity: 0.6, fontSize: 12 }}>Insufficient data</div>
            ) : (
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
                {(() => {
                  const maxAbs = Math.max(1, ...profitSeries.map(v => Math.abs(v)));
                  return profitSeries.map((v, i) => {
                    const h = Math.max(4, Math.round((Math.abs(v) / maxAbs) * 100));
                    const pos = v >= 0;
                    return (
                      <div key={i} title={`${v >= 0 ? '+' : ''}${v.toFixed(2)}`}
                        style={{ width: 8, height: h, background: pos ? '#22c55e' : '#ef4444', borderRadius: 2, opacity: 0.85 }} />
                    );
                  });
                })()}
              </div>
            )}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, minHeight: 220 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 12 }}>Bet Types</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Move vs WDL (by count)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 8, background: '#22c55e', borderRadius: 2 }} />
                <div style={{ fontSize: 12 }}>Move</div>
                <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>{betTypeBreakdown.movePct}%</div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${betTypeBreakdown.movePct}%`, height: '100%', background: 'linear-gradient(90deg,#22c55e,#4ade80)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 8, background: '#60a5fa', borderRadius: 2 }} />
                <div style={{ fontSize: 12 }}>WDL</div>
                <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>{betTypeBreakdown.wdlPct}%</div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${betTypeBreakdown.wdlPct}%`, height: '100%', background: 'linear-gradient(90deg,#60a5fa,#93c5fd)' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewStats;
