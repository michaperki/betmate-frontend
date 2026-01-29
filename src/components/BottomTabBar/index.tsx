import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

type Tab = 'Dashboard' | 'Markets' | 'My Bets' | 'Stats';

const tabs: Array<{ id: Tab; icon: string; route: string }> = [
  { id: 'Dashboard', icon: '🏠', route: '/' },
  { id: 'Markets', icon: '📊', route: '/chess/featured' },
  { id: 'My Bets', icon: '🎯', route: '/bets' },
  { id: 'Stats', icon: '📈', route: '/stats' },
];

const BottomTabBar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const active: Tab = (() => {
    const p = location.pathname;
    if (p.startsWith('/bets')) return 'My Bets';
    if (p.startsWith('/stats')) return 'Stats';
    if (p.startsWith('/chess') || p.startsWith('/matches')) return 'Markets';
    return 'Dashboard';
  })();

  return (
    <div aria-label="Primary navigation" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'none',
      background: 'rgba(18, 18, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '8px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
      zIndex: 99,
    }}
    className="bm-bottom-tabbar"
    >
      <nav style={{ display: 'flex', justifyContent: 'space-around' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => history.push(t.route)}
            aria-current={active === t.id ? 'page' : undefined}
            style={{
              background: 'none', border: 'none',
              padding: '6px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              cursor: 'pointer',
              opacity: active === t.id ? 1 : 0.6,
              color: 'var(--text-primary)'
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, color: active === t.id ? 'var(--mode-accent)' : '#e8e8e8', fontWeight: active === t.id ? 700 : 500 }}>{t.id}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @media (max-width: 860px) { .bm-bottom-tabbar { display: block !important; } }
      `}</style>
    </div>
  );
};

export default BottomTabBar;
