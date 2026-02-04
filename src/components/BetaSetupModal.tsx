import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'types/state';
import * as authRequests from 'store/requests/authRequests';
import { JWT_SIGN_IN } from 'types/resources/auth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const STORAGE_KEY = 'betmate.newSettings';

const BetaSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [odds, setOdds] = useState<'decimal' | 'fractional'>('decimal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const base = (user?.first_name || '') || (user?.email ? String(user.email).split('@')[0] : '');
    setName(base);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.oddsFormat === 'decimal' || parsed.oddsFormat === 'fractional')) setOdds(parsed.oddsFormat);
      }
    } catch {}
  }, [isOpen]);

  const persistLocalSettings = (fmt: 'decimal' | 'fractional') => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const base = raw ? JSON.parse(raw) : {};
      const next = { ...base, oddsFormat: fmt };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const onSave = async () => {
    setSaving(true); setError(null);
    try {
      // PUT /auth/me to persist first_name
      const res = await authRequests.updateMe({ first_name: name });
      const updated = (res && (res as any).user) || user;
      if (updated) dispatch({ type: JWT_SIGN_IN, payload: { user: updated }, status: 'SUCCESS' } as any);
      persistLocalSettings(odds);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 1000,
    }}>
      <div style={{
        width: 'min(520px, 92vw)', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: 20,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Welcome to BetMate Beta</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Pick your display name and odds format. You can change these later in Settings.</div>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Username</div>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g., ChessPro99" style={{
              width: '100%', padding: 10, borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)',
            }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Odds Format</div>
            <select value={odds} onChange={(e) => setOdds(e.target.value as any)} style={{
              width: '100%', padding: 10, borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)',
            }}>
              <option value="decimal">Decimal</option>
              <option value="fractional">Fractional</option>
            </select>
          </label>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={saving} style={{
            background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8,
          }}>Skip</button>
          <button onClick={onSave} disabled={saving || !name.trim()} style={{
            background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 0, color: '#000', padding: '8px 12px', borderRadius: 8, fontWeight: 700,
          }}>{saving ? 'Saving…' : 'Save & Continue'}</button>
        </div>
      </div>
    </div>
  );
};

export default BetaSetupModal;

