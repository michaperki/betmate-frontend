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
  const { mode, setMode, realEnabled } = useMode();
  const { theme, toggleTheme } = useTheme();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const cashBalance = useSelector((s: RootState) => s.auth.user?.cash_balance || 0);
  const tokenBalance = useSelector((s: RootState) => (s.auth.user?.token_balance || 0));
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

  // Allow exporting the CSS logo as a PNG (Alt+Click)
  const exportCssLogoPng = (e?: React.MouseEvent) => {
    if (!e?.altKey) return;
    try {
      const scale = 2; const W = 256 * scale; const H = 72 * scale;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d'); if (!ctx) return;
      const dot = 10 * scale; const gap = 3 * scale; const startX = 8 * scale; const startY = 16 * scale;
      const drawDot = (x: number, y: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + dot/2, y + dot/2, dot/2, 0, Math.PI*2); ctx.fill(); };
      drawDot(startX + 0 * (dot + gap), startY + 0 * (dot + gap), '#fbbf24');
      drawDot(startX + 1 * (dot + gap), startY + 0 * (dot + gap), '#f87171');
      drawDot(startX + 0 * (dot + gap), startY + 1 * (dot + gap), '#22c55e');
      drawDot(startX + 1 * (dot + gap), startY + 1 * (dot + gap), '#60a5fa');
      ctx.fillStyle = '#22c55e'; ctx.font = `${700 * scale} ${18 * scale}px 'JetBrains Mono','Roboto Mono','SF Mono',monospace`;
      ctx.textBaseline = 'top'; ctx.fillText('BetMate', startX + 2 * (dot + gap) + (8 * scale), (startY - 6 * scale));
      const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'betmate-logo.png'; a.click();
    } catch {}
  };

  // Reusable pieces
  const Brand = (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      onClick={(e) => { exportCssLogoPng(e); if (!e.altKey) goTo('/'); }}
      role="link"
      aria-label="Go to Dashboard"
      title="BetMate (Alt+Click to export logo PNG)"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--mode-accent)' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} />
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--mode-accent)', letterSpacing: 1 }}>BetMate</span>
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
            color: item === activeTab ? 'var(--nav-active)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.5,
            transition: 'color 0.2s ease',
            borderBottom: item === activeTab ? '2px solid var(--nav-active)' : '2px solid transparent',
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

  const CurrencyToggle = (
    <div
      aria-label="Toggle currency"
      role="group"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-tertiary)',
        borderRadius: 10,
        padding: 4,
        border: '1px solid var(--border-primary)'
      }}
    >
      <button
        onClick={() => setMode('real')}
        aria-pressed={mode === 'real'}
        disabled={!realEnabled}
        title={!realEnabled ? 'Cash mode unavailable' : 'Play with Cash'}
        style={{
          background: mode === 'real'
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'transparent',
          border: 'none',
          color: mode === 'real' ? '#000' : 'var(--text-secondary)',
          padding: '8px 14px',
          borderRadius: 7,
          cursor: realEnabled ? 'pointer' : 'not-allowed',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <span style={{ fontSize: 14 }}>$</span>
        Cash
      </button>
      <button
        onClick={() => setMode('arcade')}
        aria-pressed={mode === 'arcade'}
        title="Play with K-Bits"
        style={{
          background: mode === 'arcade'
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
            : 'transparent',
          border: 'none',
          color: mode === 'arcade' ? '#000' : 'var(--text-secondary)',
          padding: '8px 14px',
          borderRadius: 7,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        K-Bits
      </button>
    </div>
  );

  const AuthCluster = isAuthenticated ? (
    <>
      <button
        onClick={() => setShowDeposit(true)}
        aria-label="Deposit funds"
        style={{
          background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)',
          border: 'none',
          color: 'var(--mode-accent-contrast)',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgb(var(--mode-accent-rgb) / 0.25)'
        }}
      >
        <span style={{ fontSize: 16 }}>+</span>
        Deposit
      </button>
      <div style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: 140,
        justifyContent: 'center'
      }}>
        {(() => {
          const c = modeCurrency(mode);
          const bal = mode === 'real' ? cashBalance : tokenBalance;
          return (
            <span style={{ color: mode === 'arcade' ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{formatAmountShort(bal, c)}</span>
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
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-primary)',
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
          background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)',
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
        borderBottom: '1px solid var(--border-primary)',
        backdropFilter: 'blur(10px)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
        background: 'rgba(var(--bg-primary-rgb), 0.8)',
        fontFamily: 'inherit',
        color: 'var(--text-primary)',
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
        {!isMobile && CurrencyToggle}
        {isAuthenticated ? (
          isMobile ? (
            // On mobile, show balance and profile dropdown
            <>
              {/* Compact currency toggle for mobile */}
              <div role="group" aria-label="Toggle currency" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8 }}>
                <button
                  onClick={() => setMode('real')}
                  aria-pressed={mode === 'real'}
                  disabled={!realEnabled}
                  title={!realEnabled ? 'Cash' : 'Cash'}
                  style={{
                    background: mode === 'real' ? 'var(--success)' : 'transparent',
                    color: mode === 'real' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6
                  }}
                >$</button>
                <button
                  onClick={() => setMode('arcade')}
                  aria-pressed={mode === 'arcade'}
                  title="K-Bits"
                  style={{
                    background: mode === 'arcade' ? 'var(--warning)' : 'transparent',
                    color: mode === 'arcade' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6
                  }}
                >K</button>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                width: 110,
                justifyContent: 'center'
              }}>
                {(() => {
                  const c = modeCurrency(mode);
                  const bal = mode === 'real' ? cashBalance : tokenBalance;
                  return (
                    <span style={{ color: 'var(--mode-accent)', fontWeight: 600 }}>{formatAmountShort(bal, c)}</span>
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
            <>
              {/* Compact currency toggle for mobile (guest) */}
              <div role="group" aria-label="Toggle currency" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8 }}>
                <button
                  onClick={() => setMode('real')}
                  aria-pressed={mode === 'real'}
                  disabled={!realEnabled}
                  title={!realEnabled ? 'Cash' : 'Cash'}
                  style={{
                    background: mode === 'real' ? 'var(--success)' : 'transparent',
                    color: mode === 'real' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6
                  }}
                >$</button>
                <button
                  onClick={() => setMode('arcade')}
                  aria-pressed={mode === 'arcade'}
                  title="K-Bits"
                  style={{
                    background: mode === 'arcade' ? 'var(--warning)' : 'transparent',
                    color: mode === 'arcade' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6
                  }}
                >K</button>
              </div>
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
            </>
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
