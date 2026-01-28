import React, { useState } from 'react';

const BetMateMobileDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const user = {
    username: 'abc124',
    avatar: 'A',
    balance: 279.50,
    profit: 156.40,
    profitPercent: 12.4
  };

  const stats = {
    winRate: 54,
    totalBets: 87,
    streak: 3
  };

  const liveMatches = [
    {
      id: 1,
      white: { name: 'Magnus Carlsen', rating: 2830 },
      black: { name: 'Hikaru Nakamura', rating: 2802 },
      timeWhite: '4:32',
      timeBlack: '3:18',
      move: 28,
      format: '5+3 Blitz',
      viewers: 4521,
      pool: 2847.50,
      hot: true
    },
    {
      id: 2,
      white: { name: 'Fabiano Caruana', rating: 2786 },
      black: { name: 'Ding Liren', rating: 2780 },
      timeWhite: '12:45',
      timeBlack: '14:02',
      move: 19,
      format: '15+10 Rapid',
      viewers: 1893,
      pool: 1456.20,
      hot: false
    },
    {
      id: 3,
      white: { name: 'DrNykterstein', rating: 2839 },
      black: { name: 'Firouzja2003', rating: 2785 },
      timeWhite: '1:42',
      timeBlack: '0:58',
      move: 41,
      format: '3+0 Bullet',
      viewers: 8234,
      pool: 5621.80,
      hot: true
    }
  ];

  const activeBets = [
    { type: 'Black Win', match: 'Carlsen vs Nakamura', odds: 2.10, stake: 5.00, status: 'winning' },
    { type: 'Move Nd2', match: 'Caruana vs Ding', odds: 1.90, stake: 2.00, status: 'pending' }
  ];

  const recentActivity = [
    { type: 'White Win', result: 'won', profit: 6.75 },
    { type: 'Move e4', result: 'lost', profit: -2.00 },
    { type: 'Black Win', result: 'won', profit: 5.50 }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e8e8e8',
      paddingBottom: '100px',
      maxWidth: '430px',
      margin: '0 auto'
    }}>
      <div style={{ height: '44px', background: 'rgba(0,0,0,0.3)' }} />

      <header style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.5, marginBottom: '2px' }}>Welcome back</div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{user.username} 👋</div>
        </div>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 700,
          color: '#000'
        }}>
          {user.avatar}
        </div>
      </header>

      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>Balance</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>${user.balance.toFixed(2)}</div>
            </div>
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#22c55e',
              fontSize: '12px',
              fontWeight: 600
            }}>
              +${user.profit.toFixed(2)} ({user.profitPercent}%)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>Win Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{stats.winRate}%</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>Bets</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{stats.totalBets}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>Streak</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{stats.streak}🔥</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Live Matches</h2>
          <a href="#" style={{ fontSize: '13px', color: '#22c55e', textDecoration: 'none' }}>View All</a>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {liveMatches.map((m) => (
            <div key={m.id} style={{
              background: m.hot ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${m.hot ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 16,
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, opacity: 0.6 }}>{m.format}</span>
                <span style={{ fontSize: 12, opacity: 0.4 }}>•</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Move {m.move}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{m.white.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{m.white.rating}</div>
                </div>
                <div style={{ fontSize: 13, opacity: 0.6 }}>vs</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{m.black.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{m.black.rating}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Viewers: {m.viewers}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Pool: ${m.pool.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px', marginBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Active Bets</h2>
          <a href="#" style={{ fontSize: 13, color: '#22c55e', textDecoration: 'none' }}>Manage</a>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {activeBets.map((bet, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
              background: bet.status === 'winning' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${bet.status === 'winning' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 16,
              padding: 16
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{bet.type}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{bet.match}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>@ {bet.odds}x</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Stake</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>${bet.stake.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: bet.status === 'winning' ? '#22c55e' : '#fbbf24' }}>{bet.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: 'rgba(18, 18, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 16px 28px',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'markets', icon: '📊', label: 'Markets' },
          { id: 'bets', icon: '🎯', label: 'My Bets' },
          { id: 'stats', icon: '📈', label: 'Stats' },
          { id: 'more', icon: '☰', label: 'More' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              opacity: activeTab === tab.id ? 1 : 0.5
            }}
          >
            <span style={{ fontSize: 22, filter: activeTab === tab.id ? 'none' : 'grayscale(100%)' }}>{tab.icon}</span>
            <span style={{ fontSize: 10, color: activeTab === tab.id ? '#22c55e' : '#fff', fontWeight: activeTab === tab.id ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default BetMateMobileDashboard;

