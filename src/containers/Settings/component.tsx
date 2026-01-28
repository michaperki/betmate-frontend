import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { authTokenName } from 'utils';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import Header from '../../components/Header';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import BottomTabBar from 'components/BottomTabBar';
import { faucetCredit } from 'store/requests/billingRequests';
import * as authRequests from 'store/requests/authRequests';
import { useDispatch } from 'react-redux';
import { JWT_SIGN_IN, ADJUST_BALANCE } from 'types/resources/auth';
import { useNotifications } from 'components/NotificationCenter/context';
import { useMode } from 'context/ModeContext';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'account'|'preferences'|'notifications'|'responsible'|'security'|'wallet'>('account');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const history = useHistory();
  const location = useLocation();
  // Auth protection
  useRequireAuth();
  const STORAGE_KEY = 'betmate.newSettings';
  const [settings, setSettings] = useState({
    username: 'abc124',
    email: 'alex@example.com',
    avatar: 'A',
    defaultStake: 2.00,
    currency: 'USDT',
    oddsFormat: 'decimal',
    timezone: 'UTC-5',
    theme: 'dark',
    compactMode: false,
    showEvalBar: true,
    autoRefreshOdds: true,
    confirmBets: true,
    quickBetEnabled: false,
    emailWins: true,
    emailLosses: false,
    emailDeposits: true,
    emailPromotions: false,
    pushLiveUpdates: true,
    pushBetResults: true,
    pushPriceAlerts: true,
    pushNewMarkets: false,
    soundEffects: true,
    soundVolume: 70,
    dailyLimit: 100,
    weeklyLimit: 500,
    monthlyLimit: null as number | null,
    sessionReminder: 60,
    lossLimitEnabled: false,
    lossLimitAmount: 50,
    cooldownEnabled: false,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
  });
  const dispatch = useDispatch();
  const { notifySuccess, notifyError } = useNotifications();
  const { faucetEnabled } = useMode();
  const [faucetAmt, setFaucetAmt] = useState<number>(50);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setSettings((p) => ({ ...p, ...parsed }));
      }
    } catch {}
  }, []);

  // Persist to localStorage when settings change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = (key: string, value: any) => setSettings((p) => ({ ...p, [key]: value }));

  const sections = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'responsible', label: 'Responsible Gaming', icon: '🛡️' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'wallet', label: 'Wallet & Payments', icon: '💳' },
  ] as const;

  const Toggle: React.FC<{ enabled: boolean; onChange: (v: boolean) => void }> = ({ enabled, onChange }) => (
    <button onClick={() => onChange(!enabled)} style={{ width: 48, height: 26, borderRadius: 13, border: '1px solid var(--border-primary)', background: enabled ? 'var(--success)' : 'var(--bg-tertiary)', cursor: 'pointer', position: 'relative' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: enabled ? 25 : 3, transition: 'left 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );

  const { screenWidth } = useResponsiveLayout();
  const isCompact = screenWidth <= 860;

  return (
    <>
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'inherit', color: 'var(--text-primary)', position: 'relative' }}>
      <Header />

      <main style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '280px 1fr', maxWidth: 1200, margin: '0 auto', padding: isCompact ? '16px' : '32px 40px', gap: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Settings</h1>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>Saved locally • Server sync coming soon</div>
          <nav style={{ display: 'flex', flexDirection: isCompact ? 'row' : 'column', gap: 8, overflowX: isCompact ? 'auto' : 'visible', background: isCompact ? 'var(--bg-tertiary)' : 'transparent', border: isCompact ? '1px solid var(--border-primary)' : 'none', padding: isCompact ? 6 : 0, borderRadius: isCompact ? 12 : 0 }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isCompact ? '10px 12px' : '14px 16px', background: activeSection === s.id ? 'rgba(var(--success-rgb),0.15)' : 'transparent', border: activeSection === s.id ? '1px solid rgba(var(--success-rgb),0.3)' : '1px solid transparent', borderRadius: 10, color: activeSection === s.id ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', textAlign: 'left', whiteSpace: isCompact ? 'nowrap' : 'normal' }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 32, padding: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>Danger Zone</div>
            <button style={{ width: '100%', padding: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 8 }}>Self-Exclude (Temporary)</button>
            <button style={{ width: '100%', padding: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Delete Account</button>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 32 }}>
          {activeSection === 'account' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Account Settings</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px' }}>Manage your profile and account details</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24, background: 'var(--bg-tertiary)', borderRadius: 16, marginBottom: 24 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: 24 }}>{settings.avatar}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</div>
                    <input value={settings.username} onChange={e => updateSetting('username', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</div>
                    <input type="email" value={settings.email} onChange={e => updateSetting('email', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', fontFamily: 'inherit' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Preferences</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Default Stake</div>
                  <input type="number" value={settings.defaultStake} onChange={e => updateSetting('defaultStake', Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Quick Bet</div>
                  <Toggle enabled={settings.quickBetEnabled} onChange={v => updateSetting('quickBetEnabled', v)} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Notifications</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label><input type="checkbox" checked={settings.emailWins} onChange={e => updateSetting('emailWins', e.target.checked)} /> Email wins</label>
                <label><input type="checkbox" checked={settings.pushLiveUpdates} onChange={e => updateSetting('pushLiveUpdates', e.target.checked)} /> Live updates</label>
              </div>
            </div>
          )}

          {activeSection === 'responsible' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Responsible Gaming</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Daily Limit</div>
                  <input type="number" value={settings.dailyLimit} onChange={e => updateSetting('dailyLimit', Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Loss Limit</div>
                  <Toggle enabled={settings.lossLimitEnabled} onChange={v => updateSetting('lossLimitEnabled', v)} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Security</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Two-Factor Auth</div>
                  <Toggle enabled={settings.twoFactorEnabled} onChange={v => updateSetting('twoFactorEnabled', v)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Session Timeout (min)</div>
                  <input type="number" value={settings.sessionTimeout} onChange={e => updateSetting('sessionTimeout', Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'wallet' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Wallet & Payments</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connect wallets and manage payment preferences.</p>
              {(faucetEnabled === true) && (
                <div style={{ marginTop: 12, padding: 16, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Developer Faucet (adds Cash and K‑Bits)</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="number" min={1} max={10000} step={1} value={faucetAmt} onChange={(e) => setFaucetAmt(Math.max(1, Math.min(10000, Number(e.target.value)||0)))}
                      style={{ width: 120, padding: 10, borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                    />
                    <button
                      data-testid="wallet-faucet-btn"
                      onClick={async () => {
                        try {
                          const amt = Math.max(1, Math.min(10000, Number(faucetAmt || 0)));
                          // Explicitly credit Arcade K‑Bits only to ensure token balance changes are visible
                          const res = await faucetCredit(amt, 'BET');
                          const tokens = (res?.data as any)?.tokens;
                          // Optimistically reflect K‑Bits in UI immediately; server refresh will reconcile
                          if (typeof tokens === 'number' && Number.isFinite(tokens)) {
                            dispatch({ type: ADJUST_BALANCE, status: 'SUCCESS', payload: { delta: tokens } } as any);
                          }
                          const authRes = await authRequests.jwtSignIn();
                          const user = (authRes?.data as any)?.user;
                          if (user) dispatch({ type: JWT_SIGN_IN, payload: { user }, status: 'SUCCESS' } as any);
                          notifySuccess('Faucet Credited', `+$${amt}${typeof tokens === 'number' ? ` and +${tokens} K` : ''}`);
                        } catch (e: any) {
                          notifyError('Faucet Failed', e?.response?.data?.error || 'Try again later');
                        }
                      }}
                      style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', color: '#0a0a0f', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Get Test Funds
                    </button>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Credits both $USD and K‑Bits (dev only)</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
    <BottomTabBar />
    </>
  );
};

export default Settings;
