import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { useNewDashboardData } from './hooks/useNewDashboardData';
import { authTokenName } from 'utils';
import MockHeader from './MockHeader';
import { useNewMyBetsData } from './hooks/useNewMyBetsData';

// Standalone New Dashboard mockup page.
// Priority: visual fidelity. Inline styles preserved from mockup.
// Hooking to live data can be layered later without changing layout.

const NewDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'featured' | 'active' | 'history'>('featured');
  const history = useHistory();
  const location = useLocation();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const data = useNewDashboardData();
  const bets = useNewMyBetsData();

  // Redirect guests to mock onboarding when visiting the new dashboard
  useEffect(() => {
    try {
      const hasToken = (typeof window !== 'undefined') && !!window.localStorage.getItem(authTokenName);
      if (!isAuthenticated && !hasToken) {
        const from = encodeURIComponent(location.pathname + (location.search || ''));
        history.replace(`/new-onboarding?from=${from}`);
      }
    } catch {}
  }, [isAuthenticated, history, location.pathname, location.search]);

  // Fallback samples to preserve mock fidelity before data arrives
  const sampleRecent = useMemo(() => ([
    { type: 'White Win', odds: 1.69, amount: 2.00, result: 'won', profit: 1.38, currency: 'USDT' as const },
    { type: 'Move dxe5', odds: 3.20, amount: 2.00, result: 'lost', profit: -2.00, currency: 'USDT' as const },
    { type: 'Move Kh7', odds: 2.10, amount: 2.00, result: 'won', profit: 2.20, currency: 'USDT' as const },
    { type: 'Black Win', odds: 1.85, amount: 5.00, result: 'won', profit: 4.25, currency: 'USDT' as const },
  ]), []);
  const sampleLeaders = useMemo(() => ([
    { rank: 1, name: 'Book W.', net: 847.50, winRate: 68, avatar: '🎯' },
    { rank: 2, name: 'Michael P.', net: 623.20, winRate: 62, avatar: '🔥' },
    { rank: 3, name: 'ChessPro99', net: 441.80, winRate: 58, avatar: '♟️' },
    { rank: 4, name: 'abc124', net: 156.40, winRate: 54, avatar: '⭐', isYou: true },
    { rank: 5, name: 'GambitKing', net: 98.60, winRate: 51, avatar: '👑' },
  ]), []);
  const sampleMatches = useMemo(() => ([
    { id: '1', white: { name: 'dudalodudalo', rating: 2466 }, black: { name: 'Mahlermaniaco', rating: 2563 }, timeWhite: '8:16', timeBlack: '8:19', move: 22, phase: 'Midgame', format: '10+0 • Rapid', source: 'Lichess', viewers: 128, totalPool: 342.50, featured: true },
    { id: '2', white: { name: 'DrNykterstein', rating: 2839 }, black: { name: 'Firouzja2003', rating: 2785 }, timeWhite: '3:42', timeBlack: '2:58', move: 31, phase: 'Endgame', format: '5+3 • Blitz', source: 'Chess.com', viewers: 2341, totalPool: 1247.80, featured: false },
    { id: '3', white: { name: 'PawnStorm', rating: 1856 }, black: { name: 'KnightRider', rating: 1902 }, timeWhite: '12:30', timeBlack: '11:45', move: 8, phase: 'Opening', format: '15+10 • Rapid', source: 'Lichess', viewers: 23, totalPool: 45.00, featured: false },
  ]), []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      color: '#e8e8e8',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient glows */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(80px)'
      }} />

      {/* Shared header */}
      <MockHeader active="Dashboard" />

      {/* Header */}
      <header style={{
        display: 'none',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 15, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e', letterSpacing: '1px' }}>BetMate</span>
        </div>

        <nav style={{ display: 'flex', gap: '32px' }}>
          {['Dashboard', 'Markets', 'My Bets', 'Stats'].map((item, i) => (
            <a key={item} href="#" style={{
              color: i === 0 ? '#22c55e' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '0.5px',
              transition: 'color 0.2s ease',
              borderBottom: i === 0 ? '2px solid #22c55e' : '2px solid transparent',
              paddingBottom: '4px'
            }}>{item}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>+</span>
            Deposit
          </button>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#22c55e', fontWeight: '600' }}>{(data?.wallet?.usdt ?? 279.50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span style={{ opacity: 0.5 }}>USDT</span>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            color: '#000',
            cursor: 'pointer'
          }}>
            A
          </div>
        </div>
      </header>

      <main style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Welcome & Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Welcome Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              fontSize: '80px',
              opacity: 0.1
            }}>♟</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: '8px' }}>
              Welcome back
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{data.userName || 'abc124'}</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>Member since Jan 2025</div>
          </div>

          {/* Balance Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '12px' }}>
              Net P&L
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#22c55e',
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px'
            }}>
              {(typeof data.netPL === 'number' ? (data.netPL >= 0 ? '+' : '') + Math.abs(data.netPL).toFixed(2) : '+156.40')}
              <span style={{ fontSize: '14px', opacity: 0.7 }}>USDT</span>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: (data.netPL ?? 0) >= 0 ? '#22c55e' : '#ef4444', 
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{(data.netPL ?? 0) >= 0 ? '↑' : '↓'}</span>
              <span style={{ opacity: 0.5, color: '#e8e8e8' }}>{data.netPLPeriodLabel || 'this week'}</span>
            </div>
          </div>

          {/* Win Rate Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '12px' }}>
              Win Rate
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: '700' }}>{Math.round(data.winRate || 54)}</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>%</span>
            </div>
            <div style={{ 
              marginTop: '12px',
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '54%', 
                height: '100%', 
                background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                borderRadius: '2px'
              }} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>{`${data.approxWins || 47} of ${data.totalWagers || 87} bets won`}</div>
          </div>

          {/* Streak Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '24px'
            }}>🔥</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '12px' }}>
              Current Streak
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>3</div>
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>wins in a row</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '24px'
        }}>
          {/* Left Column - Matches */}
          <div>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              background: 'rgba(255,255,255,0.03)',
              padding: '6px',
              borderRadius: '12px',
              width: 'fit-content'
            }}>
              {[
                { id: 'featured', label: 'Live Matches', count: 3 },
                { id: 'active', label: 'My Active Bets', count: 2 },
                { id: 'history', label: 'History' }
              ].map(tab => (
                <button
                  key={tab.id as string}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: activeTab === (tab.id as any) ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                    border: activeTab === (tab.id as any) ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent',
                    color: activeTab === (tab.id as any) ? '#22c55e' : 'rgba(255,255,255,0.5)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                  {tab.count && (
                    <span style={{
                      background: activeTab === (tab.id as any) ? '#22c55e' : 'rgba(255,255,255,0.2)',
                      color: activeTab === (tab.id as any) ? '#000' : '#fff',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Main Content: switch by tab */}
            {activeTab === 'featured' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(data.liveMatches?.length ? data.liveMatches : sampleMatches).map((match) => (
                <div 
                  key={match.id}
                  style={{
                    background: match.featured 
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${match.featured ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Live pill and metadata */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>{match.format}</span>
                    <span style={{ fontSize: '12px', opacity: 0.4 }}>•</span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>{match.source}</span>
                    <span style={{ fontSize: '12px', opacity: 0.4 }}>•</span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>Move {match.move} • {match.phase}</span>
                  </div>

                  {/* Players row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '24px'
                  }}>
                    {/* White */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        background: '#e8e8e8',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: '#1a1a24'
                      }}>♔</div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{match.white.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.5 }}>{match.white.rating}</div>
                      </div>
                    </div>

                    {/* Center clock */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '12px 20px',
                      borderRadius: '10px'
                    }}>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        fontVariantNumeric: 'tabular-nums',
                        color: parseFloat(match.timeWhite) < 1 ? '#ef4444' : '#fff'
                      }}>{match.timeWhite}</span>
                      <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '12px' }}>VS</span>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        fontVariantNumeric: 'tabular-nums',
                        color: parseFloat(match.timeBlack) < 1 ? '#ef4444' : '#fff'
                      }}>{match.timeBlack}</span>
                    </div>

                    {/* Black */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{match.black.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.5 }}>{match.black.rating}</div>
                      </div>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        background: '#1a1a24',
                        border: '1px solid #333',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>♚</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ opacity: 0.5 }}>Pool: </span>
                        <span style={{ color: '#22c55e', fontWeight: '600' }}>{typeof match.totalPool === 'number' ? `$${match.totalPool.toFixed(2)}` : '—'}</span>
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ opacity: 0.5 }}>Watching: </span>
                        <span style={{ fontWeight: '600' }}>{match.viewers}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => history.push(`/new-game/${match.id}`)}
                        style={{
                         background: 'rgba(255,255,255,0.05)',
                         border: '1px solid rgba(255,255,255,0.1)',
                         color: '#fff',
                         padding: '10px 20px',
                         borderRadius: '8px',
                         cursor: 'pointer',
                         fontSize: '12px',
                         fontWeight: '600',
                         fontFamily: 'inherit'
                        }}
                      >View Game</button>
                      <button
                        onClick={() => history.push(`/new-game/${match.id}`)}
                        style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        border: 'none',
                        color: '#000',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'inherit'
                      }}
                      >Join Game</button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            ) : activeTab === 'active' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(bets.activeBets || []).map((b) => (
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
                {(bets.activeBets || []).length === 0 && (
                  <div style={{ opacity: 0.7, fontSize: 13 }}>No active bets.</div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(bets.betHistory || []).map((h) => (
                  <div key={h.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{h.match}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{h.betType} @ {h.odds}x • ${h.stake.toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: h.profit >= 0 ? '#22c55e' : '#ef4444' }}>{h.profit >= 0 ? '+' : ''}{h.profit.toFixed(2)}</div>
                  </div>
                ))}
                {(bets.betHistory || []).length === 0 && (
                  <div style={{ opacity: 0.7, fontSize: 13 }}>No history.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Activity & Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Recent Activity */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '2px', 
                  opacity: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '14px' }}>📊</span>
                  Recent Activity
                </div>
                <a onClick={() => history.push('/new-my-bets')} style={{ fontSize: '12px', color: '#22c55e', textDecoration: 'none', cursor: 'pointer' }}>View all</a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(data.recentBets?.length ? data.recentBets : sampleRecent).map((bet, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: bet.result === 'won' ? 'rgba(34, 197, 94, 0.06)' : (bet.result === 'lost' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(148, 163, 184, 0.06)'),
                    borderRadius: '10px',
                    border: `1px solid ${bet.result === 'won' ? 'rgba(34, 197, 94, 0.15)' : (bet.result === 'lost' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.15)')}`
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{bet.type}</div>
                      <div style={{ fontSize: '11px', opacity: 0.5 }}>@ {bet.odds}x • {bet.currency === 'USDT' ? ('$' + bet.amount.toFixed(2)) : `${Math.round(bet.amount)} KBITZ`}</div>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: bet.result === 'won' ? '#22c55e' : (bet.result === 'lost' ? '#ef4444' : '#94a3b8')
                    }}>
                      {bet.profit >= 0 ? '+' : ''}{bet.currency === 'USDT' ? bet.profit.toFixed(2) : Math.round(bet.profit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '2px', 
                  opacity: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '14px' }}>🏆</span>
                  Leaderboard
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.5,
                  background: 'rgba(255,255,255,0.05)',
                  padding: '4px 10px',
                  borderRadius: '4px'
                }}>This Week</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.leaderboardTop5?.length ? data.leaderboardTop5 : sampleLeaders).map((user, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: (user as any).isYou ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                    borderRadius: '10px',
                    border: (user as any).isYou ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent'
                  }}>
                    <div style={{
                      width: '24px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: user.rank <= 3 ? ['#fbbf24', '#94a3b8', '#cd7f32'][user.rank - 1] : 'rgba(255,255,255,0.4)'
                    }}>
                      {user.rank}
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      {(user as any).avatar || '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {user.name}
                        {(user as any).isYou && (
                          <span style={{
                            fontSize: '9px',
                            background: '#22c55e',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '700'
                          }}>YOU</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.5 }}>{typeof (user as any).winRate === 'number' ? `${(user as any).winRate}% win rate` : '—% win rate'}</div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#22c55e'
                    }}>
                      +${user.net.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Mini */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.02) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '16px',
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Total Wagered</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>${(data.quickStats?.totalWagered ?? 1247.8).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Avg Bet Size</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>${(data.quickStats?.avgBetSize ?? 14.34).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Best Win</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>+${(data.quickStats?.bestWin ?? 87.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Favorite Bet</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{data.quickStats?.favorite || 'Move'}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default NewDashboard;
