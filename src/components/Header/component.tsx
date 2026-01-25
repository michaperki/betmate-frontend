import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMode } from 'context/ModeContext';
import ProfileDropdown from './ProfileDropdown';
import { useTheme } from 'context/ThemeContext';
import { RootState } from 'types/state';
import DepositModal from './DepositModal';
import { formatAmountShort, modeCurrency, currencyShortName } from 'utils/currency';

const Header: React.FC<{ active?: 'Dashboard' | 'Markets' | 'My Bets' | 'Stats' }>
  = ({ active }) => {
  const history = useHistory();
  const location = useLocation();
  const { mode } = useMode();
  const { theme, toggleTheme } = useTheme();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const cashBalance = useSelector((s: RootState) => s.auth.user?.cash_balance || 0);
  const tokenBalance = useSelector((s: RootState) => s.auth.user?.token_balance || 0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport width to switch to mobile layout
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    };
    // set initial
    handleChange(mql as any);
    // subscribe
    if (mql.addEventListener) mql.addEventListener('change', handleChange as any);
    else (mql as any).addListener && (mql as any).addListener(handleChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handleChange as any);
      else (mql as any).removeListener && (mql as any).removeListener(handleChange);
    };
  }, []);

  const navItems: Array<'Dashboard' | 'Markets' | 'My Bets' | 'Stats'> = ['Dashboard', 'Markets', 'My Bets', 'Stats'];

  // Determine active tab from current route if not provided
  const detectedActive = useMemo(() => {
    const p = location.pathname;
    if (p === '/' || p.startsWith('/dashboard')) return 'Dashboard' as const;
    if (p.startsWith('/bets')) return 'My Bets' as const;
    if (p.startsWith('/stats')) return 'Stats' as const;
    if (p.startsWith('/chess') || p.startsWith('/matches')) return 'Markets' as const;
    return 'Dashboard' as const;
  }, [location.pathname]);
  const activeTab = active || detectedActive;

  const goTo = (path: string) => {
    history.push(path);
    setMenuOpen(false);
  };

  // Reusable pieces
  const Brand = (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      onClick={() => goTo('/')}
      role="link"
      aria-label="Go to Dashboard"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} />
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', letterSpacing: 1 }}>BetMate</span>
    </div>
  );

  const NavLinks = (
    <nav style={{ display: 'flex', gap: isMobile ? 16 : 32, flexWrap: isMobile ? 'wrap' as const : 'nowrap', rowGap: 8 }}>
      {navItems.map((item) => (
        <a
          key={item}
          href="#"
          aria-current={item === activeTab ? 'page' : undefined}
          style={{
            color: item === activeTab ? '#22c55e' : 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.5,
            transition: 'color 0.2s ease',
            borderBottom: item === activeTab ? '2px solid #22c55e' : '2px solid transparent',
            paddingBottom: 4
          }}
          onClick={(e) => {
            e.preventDefault();
            if (item === 'Dashboard') goTo('/');
            else if (item === 'Markets') goTo('/chess/featured');
            else if (item === 'My Bets') goTo('/bets');
            else if (item === 'Stats') goTo('/stats');
          }}
        >
          {item}
        </a>
      ))}
    </nav>
  );

  const ThemeToggleBtn = (
    <button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        width: 44,
        height: 26,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.15)',
        background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: 3.5,
        left: theme === 'dark' ? 4 : 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11
      }}>{theme === 'dark' ? '🌙' : '☀️'}</div>
    </button>
  );

  const AuthCluster = isAuthenticated ? (
    <>
      <button
        onClick={() => setShowDeposit(true)}
        aria-label="Deposit funds"
        style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22c55e',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <span style={{ fontSize: 16 }}>+</span>
        Deposit
      </button>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {(() => {
          const c = modeCurrency(mode);
          const bal = mode === 'real' ? cashBalance : tokenBalance;
          return (
            <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatAmountShort(bal, c)}</span>
          );
        })()}
      </div>
      <ProfileDropdown />
    </>
  ) : (
    <>
      <button
        onClick={() => {
          try {
            const from = encodeURIComponent(location.pathname + (location.search || ''));
            goTo(`/signin?from=${from}`);
          } catch {
            goTo('/signin');
          }
        }}
        aria-label="Sign in"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#e8e8e8',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit'
        }}
      >Sign In</button>
      <button
        onClick={() => { goTo('/onboarding'); }}
        aria-label="Get started"
        style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          border: 'none',
          color: '#000',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'inherit'
        }}
      >Get Started</button>
    </>
  );

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '12px 16px' : '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 15, 0.8)',
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        color: '#e8e8e8',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {Brand}

      {/* Desktop center nav */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {NavLinks}
        </div>
      )}

      {/* Right cluster on desktop; simplified on mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
        {!isMobile && ThemeToggleBtn}
        {isAuthenticated ? (
          isMobile ? (
            // On mobile, show balance and profile dropdown
            <>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center'
              }}>
                {(() => {
                  const c = modeCurrency(mode);
                  const bal = mode === 'real' ? cashBalance : tokenBalance;
                  return (
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatAmountShort(bal, c)}</span>
                  );
                })()}
              </div>
              <ProfileDropdown />
            </>
          ) : (
            // On desktop, show the full auth cluster
            AuthCluster
          )
        ) : (
          // For non-authenticated users on mobile, show just the sign in button
          isMobile ? (
            <button
              onClick={() => {
                try {
                  const from = encodeURIComponent(location.pathname + (location.search || ''));
                  goTo(`/signin?from=${from}`);
                } catch {
                  goTo('/signin');
                }
              }}
              aria-label="Sign in"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e8e8e8',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit'
              }}
            >Sign In</button>
          ) : (
            // On desktop, show both buttons
            AuthCluster
          )
        )}
      </div>


      {showDeposit && (
        <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      )}
    </header>
  );
};

export default Header;
