export type Currency = 'BET' | 'USDT';

export const currencySymbol = (c: Currency): string => (c === 'USDT' ? '$' : '');

export const formatAmount = (amount: number, c: Currency): string => {
  const safe = Number(amount) || 0;
  if (c === 'USDT') return `$${safe.toFixed(2)}`;
  return `${Math.round(safe)} KBITZ`;
};

export const formatNet = (delta: number, c: Currency): string => {
  const safe = Number(delta) || 0;
  const sign = safe >= 0 ? '+' : '-';
  const abs = Math.abs(safe);
  if (c === 'USDT') return `${sign}$${abs.toFixed(2)}`;
  return `${sign}${Math.round(abs)} KBITZ`;
};

export const modeCurrency = (mode: 'arcade' | 'real'): Currency => (mode === 'real' ? 'USDT' : 'BET');
