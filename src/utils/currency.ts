export type Currency = 'BET' | 'USDT';

// Symbol used for compact amounts
export const currencySymbol = (c: Currency): string => (c === 'USDT' ? '$' : 'K');

// Long/marketing names used in labels
export const currencyLongName = (c: Currency): string => (c === 'USDT' ? 'BetMate Cash' : 'K-BITS');

// Short label for chips and small UI (no marketing term)
export const currencyShortName = (c: Currency): string => (c === 'USDT' ? 'Cash' : 'K');

// Legacy formatter retained for back-compat in legacy views
export const formatAmount = (amount: number, c: Currency): string => {
  const safe = Number(amount) || 0;
  if (c === 'USDT') return `$${safe.toFixed(2)}`;
  return `${Math.round(safe)} KBITZ`;
};

// Compact formatter for new mock-first UI
export const formatAmountShort = (amount: number, c: Currency): string => {
  const safe = Number(amount) || 0;
  if (c === 'USDT') return `$${safe.toFixed(2)}`;
  return `${Math.round(safe)} K`;
};

export const formatNet = (delta: number, c: Currency): string => {
  const safe = Number(delta) || 0;
  const sign = safe >= 0 ? '+' : '-';
  const abs = Math.abs(safe);
  if (c === 'USDT') return `${sign}$${abs.toFixed(2)}`;
  return `${sign}${Math.round(abs)} K`;
};

export const modeCurrency = (mode: 'arcade' | 'real'): Currency => (mode === 'real' ? 'USDT' : 'BET');
