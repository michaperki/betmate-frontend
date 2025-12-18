import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ROOT_URL } from 'utils';

export type BetMode = 'arcade' | 'real';

type ModeContextValue = {
  mode: BetMode;
  setMode: (m: BetMode) => void;
  toggleMode: () => void;
  realEnabled: boolean;
  withdrawEnabled?: boolean;
  requireKyc?: boolean;
  pricingVersion?: string;
  faucetEnabled?: boolean;
  risk?: {
    margins?: { baseMargin: number; drawExtraMargin: number; extraMarginLowConf?: number };
    confidence?: { earlyMoveNum?: number };
    maxOdds?: { white_win: number; draw: number; black_win: number };
  };
  limits?: { arcadeMaxStakeMove: number; arcadeMaxStakeWdl: number; arcadeMoveMargin: number; poolRake: number };
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
  const [withdrawEnabled, setWithdrawEnabled] = useState<boolean | undefined>(undefined);
  const [requireKyc, setRequireKyc] = useState<boolean | undefined>(undefined);
  const [pricingVersion, setPricingVersion] = useState<string | undefined>(undefined);
  const [faucetEnabled, setFaucetEnabled] = useState<boolean | undefined>(undefined);
  const [risk, setRisk] = useState<ModeContextValue['risk']>(undefined);
  const [limits, setLimits] = useState<ModeContextValue['limits']>(undefined);

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
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${ROOT_URL}/api/status`);
        const json = await res.json();
        const enabled = !!json?.features?.realModeEnabled;
        const pv: string | undefined = json?.pricing?.pricingModelVersion || undefined;
        const fe: boolean | undefined = json?.features?.enableFaucet;
        const we: boolean | undefined = json?.features?.enableWithdrawals;
        const rkf: boolean | undefined = json?.features?.requireKyc;
        const rk: any = json?.risk || undefined;
        const lm: any = json?.limits || undefined;
        if (!isMounted) return;
        setRealEnabled(enabled);
        setPricingVersion(pv);
        setFaucetEnabled(fe);
        setWithdrawEnabled(we);
        setRequireKyc(rkf);
        setRisk(rk);
        setLimits(lm);
        if (!enabled && mode === 'real') setModeState('arcade');
      } catch {
        // If status fails, keep previous values
      }
    };
    fetchStatus();
    const onRefresh = () => { fetchStatus(); };
    window.addEventListener('betmate:refresh-status', onRefresh as any);
    return () => { isMounted = false; window.removeEventListener('betmate:refresh-status', onRefresh as any); };
  }, [mode]);

  const setMode = (m: BetMode) => setModeState(m === 'real' && !realEnabled ? 'arcade' : m);
  const toggleMode = () => setModeState(prev => {
    if (!realEnabled) return 'arcade';
    return prev === 'arcade' ? 'real' : 'arcade';
  });

  const value = useMemo(() => ({ mode, setMode, toggleMode, realEnabled, withdrawEnabled, requireKyc, pricingVersion, faucetEnabled, risk, limits }), [mode, realEnabled, withdrawEnabled, requireKyc, pricingVersion, faucetEnabled, risk, limits]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
