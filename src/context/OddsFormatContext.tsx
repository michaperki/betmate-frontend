import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type OddsFormat = 'decimal' | 'fractional';

type Ctx = {
  format: OddsFormat;
  setFormat: (f: OddsFormat) => void;
  formatOdds: (multiplier: number) => string; // returns formatted string based on current format
};

const STORAGE_KEY = 'betmate:oddsFormat';

const OddsFormatContext = createContext<Ctx | undefined>(undefined);

function toFractionString(multiplier: number): string {
  const m = Math.max(1, Number(multiplier) || 1);
  const x = m - 1; // fractional odds exclude stake
  // Approximate x as a simple fraction using continued fractions
  let a = x;
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0;
  for (let i = 0; i < 10; i++) {
    const ai = Math.floor(a + 1e-9);
    const h = ai * h1 + h0; const k = ai * k1 + k0;
    if (Math.abs(h / k - x) < 1e-6 || k > 100) { return `${Math.max(1, Math.round(h))}/${Math.max(1, Math.round(k))}`; }
    h0 = h1; k0 = k1; h1 = h; k1 = k; a = 1 / (a - ai + 1e-9);
  }
  return `${Math.round(x * 10)}/${10}`;
}

export const OddsFormatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [format, setFormatState] = useState<OddsFormat>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return (s === 'fractional' || s === 'decimal') ? (s as OddsFormat) : 'decimal';
    } catch { return 'decimal'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, format); } catch {}
  }, [format]);

  const setFormat = (f: OddsFormat) => setFormatState(f);

  const formatOdds = useMemo(() => (mult: number) => {
    if (format === 'fractional') return toFractionString(mult);
    const m = Number(mult) || 1; return `x${m.toFixed(2)}`;
  }, [format]);

  const value = useMemo(() => ({ format, setFormat, formatOdds }), [format, formatOdds]);
  return <OddsFormatContext.Provider value={value}>{children}</OddsFormatContext.Provider>;
};

export function useOddsFormat(): Ctx {
  const ctx = useContext(OddsFormatContext);
  if (!ctx) throw new Error('useOddsFormat must be used within OddsFormatProvider');
  return ctx;
}

