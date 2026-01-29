import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { RootState } from 'types/state';
import { useMode } from 'context/ModeContext';
import { signOutUser } from 'store/actionCreators/authActionCreators';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import { currencyShortName, formatAmountShort, modeCurrency } from 'utils/currency';

const ProfileDropdown: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const { mode } = useMode();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const user = useSelector((s: RootState) => s.auth.user);
  const cashBalance = Number(user?.cash_balance || 0);
  const tokenBalance = Number(user?.token_balance || 0);
  const avatar = (user?.first_name?.[0] || user?.full_name?.[0] || 'A').toUpperCase();

  const [open, setOpen] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!isAuthenticated) return null;

  const go = (path: string) => {
    setOpen(false);
    history.push(path);
  };

  const signOut = () => {
    setOpen(false);
    try { dispatch(signOutUser()); } catch {}
    history.push('/');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: open ? 'linear-gradient(135deg, var(--mode-accent-strong) 0%, var(--mode-accent) 100%)' : 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)',
          border: open ? '2px solid rgb(var(--mode-accent-rgb) / 0.45)' : '2px solid transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'var(--mode-accent-contrast)', cursor: 'pointer',
          boxShadow: '0 0 0 2px rgb(var(--mode-accent-rgb) / 0.20)'
        }}
      >
        {avatar}
      </button>

      {open && (
        <div role="menu" style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: 280,
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: 16, borderBottom: '1px solid rgb(var(--text-primary-rgb) / 0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', color: 'var(--mode-accent-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.full_name || user?.first_name || 'User'}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{user?.email || ''}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: 8 }}>
            <a role="menuitem" onClick={() => go('/bets')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, color: 'var(--text-primary)', textDecoration: 'none', cursor: 'pointer' }}>🎯 <span style={{ fontSize: 14 }}>My Bets</span></a>
            <a role="menuitem" onClick={() => go('/user')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, color: 'var(--text-primary)', textDecoration: 'none', cursor: 'pointer' }}>⚙️ <span style={{ fontSize: 14 }}>Settings</span></a>
            <a role="menuitem" onClick={() => go('/stats')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, color: 'var(--text-primary)', textDecoration: 'none', cursor: 'pointer' }}>📊 <span style={{ fontSize: 14 }}>Statistics</span></a>
            <a
              role="menuitem"
              onClick={() => { setOpen(false); setShowDeposit(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, color: 'var(--mode-accent)', textDecoration: 'none', cursor: 'pointer', background: 'rgb(var(--mode-accent-rgb) / 0.10)', border: '1px solid rgb(var(--mode-accent-rgb) / 0.20)' }}
            >💰 <span style={{ fontSize: 14, fontWeight: 600 }}>Deposit</span></a>
            <a
              role="menuitem"
              onClick={() => { setOpen(false); setShowWithdraw(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, color: 'var(--error)', textDecoration: 'none', cursor: 'pointer', background: 'rgb(var(--error-rgb) / 0.10)', border: '1px solid rgb(var(--error-rgb) / 0.20)', marginTop: 6 }}
            >🏧 <span style={{ fontSize: 14, fontWeight: 600 }}>Withdraw</span></a>
          </div>
          <div style={{ height: 1, background: 'rgb(var(--text-primary-rgb) / 0.06)', margin: '4px 0' }} />

          {/* Footer */}
          <div style={{ padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', fontSize: 12, opacity: 0.8 }}>
              <span>Balance</span>
              {(() => {
                const c = modeCurrency(mode);
                const bal = mode === 'real' ? cashBalance : tokenBalance;
                return (
                  <span style={{ color: 'var(--mode-accent)', fontWeight: 600 }}>{formatAmountShort(bal, c)}</span>
                );
              })()}
            </div>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', border: 'none', borderRadius: 10, background: 'rgb(var(--error-rgb) / 0.08)', color: 'var(--error)', cursor: 'pointer' }}>🚪 <span style={{ fontSize: 14, fontWeight: 500 }}>Sign Out</span></button>
          </div>
        </div>
      )}
      {showDeposit && (
        <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      )}
      {showWithdraw && (
        <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
      )}
    </div>
  );
};

export default ProfileDropdown;
