import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { authTokenName } from 'utils';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useMyBetsData } from '../../hooks/useMyBetsData';
import Header from '../../components/Header';
import BottomTabBar from 'components/BottomTabBar';
import EmptyState from 'components/EmptyState';
import { useOddsFormat } from 'context/OddsFormatContext';

const MyBets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active'|'history'>('active');
  const [resultFilter, setResultFilter] = useState<'all'|'won'|'lost'|'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date-desc'|'date-asc'|'stake-desc'|'stake-asc'>('date-desc');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const history = useHistory();
  const location = useLocation();
  // Auth protection
  useRequireAuth();
  const data = useMyBetsData();
  const { formatOdds } = useOddsFormat();

  const filteredHistory = useMemo(() => {
    let arr = data.betHistory || [];
    if (resultFilter !== 'all') {
      arr = arr.filter((h: any) => h.result === resultFilter);
    }
    const sorter = (a: any, b: any) => {
      if (sortBy.startsWith('date')) {
        const ta = new Date(a.date || 0).getTime();
        const tb = new Date(b.date || 0).getTime();
        return sortBy === 'date-desc' ? (tb - ta) : (ta - tb);
      }
      if (sortBy.startsWith('stake')) {
        return sortBy === 'stake-desc' ? (b.stake - a.stake) : (a.stake - b.stake);
      }
      return 0;
    };
    return arr.slice().sort(sorter);
  }, [data.betHistory, resultFilter, sortBy]);

  const activeBets = data.activeBets || [];
  const betHistory = data.betHistory || [];
  const quick = data.quick || { todayPL: 0, weekPL: 0, monthPL: 0, winRate: 0, avgOdds: 0, totalBets: 0, wonBets: 0, lostBets: 0 };

  return (
    <>
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'inherit', color: 'var(--text-primary)', position: 'relative' }}>
      <Header active="My Bets" />

      <main style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              My Bets
              <span style={{ background: 'rgb(var(--mode-accent-rgb) / 0.15)', border: '1px solid rgb(var(--mode-accent-rgb) / 0.30)', color: 'var(--mode-accent)', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{activeBets.length} Active</span>
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Track your positions and betting history</p>
          </div>
          <div style={{ display: 'flex', gap: 24, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Today</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: quick.todayPL >= 0 ? 'var(--mode-accent)' : '#ef4444' }}>{quick.todayPL >= 0 ? '+' : ''}{quick.todayPL.toFixed(2)}</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-primary)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>This Week</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: quick.weekPL >= 0 ? 'var(--mode-accent)' : '#ef4444' }}>{quick.weekPL >= 0 ? '+' : ''}{quick.weekPL.toFixed(2)}</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-primary)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>This Month</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: quick.monthPL >= 0 ? 'var(--mode-accent)' : '#ef4444' }}>{quick.monthPL >= 0 ? '+' : ''}{quick.monthPL.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', padding: 6, borderRadius: 12, width: 'fit-content' }}>
          {([ 
            { id: 'active', label: 'Active Bets' },
            { id: 'history', label: 'History' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: activeTab === t.id ? 'rgb(var(--mode-accent-rgb) / 0.15)' : 'transparent', border: activeTab === t.id ? '1px solid rgb(var(--mode-accent-rgb) / 0.30)' : '1px solid transparent', color: activeTab === t.id ? 'var(--mode-accent)' : 'var(--text-secondary)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'history' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Filter:</div>
            {(['all','won','lost','cancelled'] as const).map(f => (
              <button key={f} onClick={() => setResultFilter(f)} style={{ padding: '8px 12px', borderRadius: 8, border: resultFilter === f ? '1px solid rgba(var(--success-rgb),0.3)' : '1px solid var(--border-primary)', background: resultFilter === f ? 'rgba(var(--success-rgb),0.15)' : 'var(--bg-tertiary)', color: resultFilter === f ? 'var(--success)' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{f[0].toUpperCase()+f.slice(1)}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sort:</div>
              {([
                { id: 'date-desc', label: 'Newest' },
                { id: 'date-asc', label: 'Oldest' },
                { id: 'stake-desc', label: 'Stake ↓' },
                { id: 'stake-asc', label: 'Stake ↑' },
              ] as const).map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={{ padding: '8px 12px', borderRadius: 8, border: sortBy === s.id ? '1px solid rgba(var(--success-rgb),0.3)' : '1px solid var(--border-primary)', background: sortBy === s.id ? 'rgba(var(--success-rgb),0.15)' : 'var(--bg-tertiary)', color: sortBy === s.id ? 'var(--success)' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{s.label}</button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'active' ? (
          <div className="scroll-panel scroll-panel--tall scroll-panel--tall-active">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeBets.map((b) => (
                <div key={b.id} style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12 }}>
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
                      <div style={{ fontSize: 12, opacity: 0.6 }}>@ {formatOdds(b.odds)}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>${b.stake.toFixed(2)}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mode-accent)' }}>→ ${b.potentialWin.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {activeBets.length === 0 && (
                <EmptyState
                  icon={<span>🎯</span>}
                  title="No Active Bets"
                  description="You don't have any bets in play right now. Find a game and make your first prediction!"
                  ctaLabel="Browse Live Games"
                  onCtaClick={() => history.push('/chess/featured?newUI=1')}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="scroll-panel scroll-panel--tall scroll-panel--tall-history">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredHistory.map((h: any) => (
                <div key={h.id} onClick={() => history.push(`/matches/${h.gameId || ''}`)} style={{ padding: '12px 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{h.match}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{h.betType} @ {formatOdds(h.odds)} • ${h.stake.toFixed(2)}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: h.profit >= 0 ? 'var(--mode-accent)' : '#ef4444' }}>{h.profit >= 0 ? '+' : ''}{h.profit.toFixed(2)}</div>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <EmptyState
                  icon={<span>📜</span>}
                  title="No Betting History"
                  description="Your completed bets will appear here."
                  ctaLabel="Start Betting"
                  onCtaClick={() => history.push('/chess/featured?newUI=1')}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
    <BottomTabBar />
    </>
  );
};

export default MyBets;
