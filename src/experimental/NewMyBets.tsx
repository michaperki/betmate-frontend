import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { authTokenName } from 'utils';
import { useNewMyBetsData } from './hooks/useNewMyBetsData';
import MockHeader from './MockHeader';

const NewMyBets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active'|'history'>('active');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const history = useHistory();
  const location = useLocation();
  useEffect(() => {
    try {
      const hasToken = (typeof window !== 'undefined') && !!window.localStorage.getItem(authTokenName);
      if (!isAuthenticated && !hasToken) {
        const from = encodeURIComponent(location.pathname + (location.search || ''));
        history.replace(`/new-onboarding?from=${from}`);
      }
    } catch {}
  }, [isAuthenticated, history, location.pathname, location.search]);
  const data = useNewMyBetsData();

  const activeBets = data.activeBets || [];
  const betHistory = data.betHistory || [];
  const quick = data.quick || { todayPL: 0, weekPL: 0, monthPL: 0, winRate: 0, avgOdds: 0, totalBets: 0, wonBets: 0, lostBets: 0 };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', fontFamily: "'JetBrains Mono','SF Mono',monospace", color: '#e8e8e8', position: 'relative' }}>
      <MockHeader active="My Bets" />

      <main style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              My Bets
              <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{activeBets.length} Active</span>
            </h1>
            <p style={{ margin: '8px 0 0', opacity: 0.5, fontSize: 14 }}>Track your positions and betting history</p>
          </div>
          <div style={{ display: 'flex', gap: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Today</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: quick.todayPL >= 0 ? '#22c55e' : '#ef4444' }}>{quick.todayPL >= 0 ? '+' : ''}{quick.todayPL.toFixed(2)}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>This Week</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: quick.weekPL >= 0 ? '#22c55e' : '#ef4444' }}>{quick.weekPL >= 0 ? '+' : ''}{quick.weekPL.toFixed(2)}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>This Month</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: quick.monthPL >= 0 ? '#22c55e' : '#ef4444' }}>{quick.monthPL >= 0 ? '+' : ''}{quick.monthPL.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 12, width: 'fit-content' }}>
          {([
            { id: 'active', label: 'Active Bets' },
            { id: 'history', label: 'History' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: activeTab === t.id ? 'rgba(34,197,94,0.15)' : 'transparent', border: activeTab === t.id ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent', color: activeTab === t.id ? '#22c55e' : 'rgba(255,255,255,0.5)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'active' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeBets.map((b) => (
              <div key={b.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: '#e8e8e8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a24' }}>♔</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.match.white} vs {b.match.black}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>Move {b.move} • {b.phase}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{b.category === 'move' ? b.betType : `${b.betType}`}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>@ {b.odds}x</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>${b.stake.toFixed(2)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>→ ${b.potentialWin.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
            {activeBets.length === 0 && (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No active bets.</div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {betHistory.map((h) => (
              <div key={h.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{h.match}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{h.betType} @ {h.odds}x • ${h.stake.toFixed(2)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: h.profit >= 0 ? '#22c55e' : '#ef4444' }}>{h.profit >= 0 ? '+' : ''}{h.profit.toFixed(2)}</div>
              </div>
            ))}
            {betHistory.length === 0 && (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No history.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default NewMyBets;
