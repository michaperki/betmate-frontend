import React, { useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMode } from 'context/ModeContext';
import ProfileDropdown from './ProfileDropdown';
import { RootState } from 'types/state';
import MockDepositModal from './MockDepositModal';

const MockHeader: React.FC<{ active?: 'Dashboard' | 'Markets' | 'My Bets' | 'Stats' }>
  = ({ active }) => {
  const history = useHistory();
  const location = useLocation();
  const { mode } = useMode();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const cashBalance = useSelector((s: RootState) => s.auth.user?.cash_balance || 0);
  const [showDeposit, setShowDeposit] = useState(false);

  const navItems: Array<'Dashboard' | 'Markets' | 'My Bets' | 'Stats'> = ['Dashboard', 'Markets', 'My Bets', 'Stats'];

  // Determine active tab from current route if not provided
  const detectedActive = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/new-dashboard')) return 'Dashboard' as const;
    if (p.startsWith('/new-my-bets')) return 'My Bets' as const;
    if (p.startsWith('/new-stats')) return 'Stats' as const;
    if (p.startsWith('/chess') || p.startsWith('/new-game')) return 'Markets' as const;
    return 'Dashboard' as const;
  }, [location.pathname]);
  const activeTab = active || detectedActive;

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(10px)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 15, 0.8)',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      color: '#e8e8e8'
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => history.push('/new-dashboard')}
        role="link"
        aria-label="Go to Dashboard"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa' }} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e', letterSpacing: '1px' }}>BetMate</span>
      </div>

      <nav style={{ display: 'flex', gap: '32px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {navItems.map((item) => (
          <a key={item} href="#" aria-current={item === activeTab ? 'page' : undefined} style={{
            color: item === activeTab ? '#22c55e' : 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            transition: 'color 0.2s ease',
            borderBottom: item === activeTab ? '2px solid #22c55e' : '2px solid transparent',
            paddingBottom: '4px'
          }}
          onClick={(e) => {
            e.preventDefault();
            if (item === 'Dashboard') history.push('/new-dashboard');
            else if (item === 'Markets') history.push('/chess/featured?newUI=1');
            else if (item === 'My Bets') history.push('/new-my-bets');
            else if (item === 'Stats') history.push('/new-stats');
          }}
          >{item}</a>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setShowDeposit(true)}
              aria-label="Deposit funds"
              style={{
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
              <span style={{ color: '#22c55e', fontWeight: '600' }}>{(cashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span style={{ opacity: 0.5 }}>{mode === 'real' ? 'USDT' : 'KBITZ'}</span>
            </div>
            <ProfileDropdown />
          </>
        ) : (
          <>
            <button
              onClick={() => {
                try {
                  const from = encodeURIComponent(location.pathname + (location.search || ''));
                  history.push(`/new-login?from=${from}`);
                } catch {
                  history.push('/new-login');
                }
              }}
              aria-label="Sign in"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e8e8e8',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'inherit'
              }}
            >Sign In</button>
            <button
              onClick={() => { history.push('/new-onboarding'); }}
              aria-label="Get started"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: 'none',
                color: '#000',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                fontFamily: 'inherit'
              }}
            >Get Started</button>
          </>
        )}
      </div>
      {showDeposit && (
        <MockDepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      )}
    </header>
  );
};

export default MockHeader;
