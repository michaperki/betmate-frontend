import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ROOT_URL } from 'utils';

export type BetMode = 'arcade' | 'real';

type ModeContextValue = {
  mode: BetMode;
  setMode: (m: BetMode) => void;
  toggleMode: () => void;
  realEnabled: boolean;
  pricingVersion?: string;
};

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'betmate.mode';

function getInitialMode(): BetMode {
  if (typeof window === 'undefined') return 'arcade';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (stored === 'real' || stored === 'arcade') ? (stored as BetMode) : 'arcade';
}

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<BetMode>(getInitialMode);
  const [realEnabled, setRealEnabled] = useState<boolean>(true);
  const [pricingVersion, setPricingVersion] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  // Optional sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'arcade' || e.newValue === 'real')) {
        setModeState(e.newValue as BetMode);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Fetch feature flags from backend
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`${ROOT_URL}/api/status`);
        const json = await res.json();
        const enabled = !!json?.features?.realModeEnabled;
        const pv: string | undefined = json?.pricing?.pricingModelVersion || undefined;
        if (!isMounted) return;
        setRealEnabled(enabled);
        setPricingVersion(pv);
        if (!enabled && mode === 'real') setModeState('arcade');
      } catch {
        // If status fails, assume enabled to avoid blocking UX
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const setMode = (m: BetMode) => setModeState(m === 'real' && !realEnabled ? 'arcade' : m);
  const toggleMode = () => setModeState(prev => {
    if (!realEnabled) return 'arcade';
    return prev === 'arcade' ? 'real' : 'arcade';
  });

  const value = useMemo(() => ({ mode, setMode, toggleMode, realEnabled, pricingVersion }), [mode, realEnabled, pricingVersion]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
