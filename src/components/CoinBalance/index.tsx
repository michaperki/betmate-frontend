import React, { useEffect, useRef, useState } from 'react';
import BalanceIcon from 'assets/wager_panel/balance-icon.svg';

import './style.scss';

export type BetMode = 'arcade' | 'real';

interface CoinBalanceProps {
  // Back-compat: if token/cash not provided, fall back to this value
  balance?: number;
  tokenBalance?: number;
  cashBalance?: number;
  mode?: BetMode;
  label?: string; // e.g., 'Arcade' | 'Real'
  className?: string;
  compact?: boolean;
  armed?: boolean; // two-click hint styling
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  title?: string;
  ariaLabel?: string;
}

const CoinBalance: React.FC<CoinBalanceProps> = ({
  balance,
  tokenBalance,
  cashBalance,
  mode,
  label,
  className,
  compact = false,
  armed = false,
  onClick,
  onKeyDown,
  title,
  ariaLabel,
}) => {
  const selectBalance = (): number | undefined => {
    if (mode === 'arcade') return tokenBalance ?? balance;
    if (mode === 'real') return cashBalance ?? 0; // default to 0 if not provided
    return balance;
  };

  const activeRaw = selectBalance();
  if (activeRaw === undefined) return null;
  const active = Math.max(0, activeRaw);

  const [display, setDisplay] = useState<number>(Math.round(active));
  const [updating, setUpdating] = useState(false);
  const prevRef = useRef<number>(Math.round(active));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = Math.round(Math.max(0, selectBalance() ?? 0));
    if (start === end) return;

    setUpdating(true);
    const duration = 300; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const value = Math.round(start + (end - start) * t);
      setDisplay(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = end;
        setTimeout(() => setUpdating(false), 200);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tokenBalance, cashBalance, balance, mode]);

  const unit = mode === 'real' ? 'cash' : 'tokens';

  return (
    <div
      className={`coin-balance ${compact ? 'compact' : ''} ${updating ? 'is-updating' : ''} ${armed ? 'is-armed' : ''} ${className || ''}`}
      title={title || 'Your balance'}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || 'Balance and mode'}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <img src={BalanceIcon} alt="Balance" className="balance-icon" />
      <span className="balance-text">
        {display} <span className={`tokens-text ${compact ? 'hidden' : ''}`}>{unit}</span>
      </span>
      {label && <span className="mode-label">{label}</span>}
    </div>
  );
};

export default CoinBalance;
