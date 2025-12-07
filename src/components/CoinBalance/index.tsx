import React, { useEffect, useRef, useState } from 'react';
import BalanceIcon from 'assets/wager_panel/balance-icon.svg';

import './style.scss';

interface CoinBalanceProps {
  balance: number | undefined;
  className?: string;
  compact?: boolean;
}

const CoinBalance: React.FC<CoinBalanceProps> = ({ balance, className, compact = false }) => {
  if (balance === undefined) return null;

  const [display, setDisplay] = useState<number>(Math.round(balance));
  const [updating, setUpdating] = useState(false);
  const prevRef = useRef<number>(Math.round(balance));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = Math.round(balance);
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
        // settle and clear highlight
        setTimeout(() => setUpdating(false), 200);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [balance]);

  return (
    <div className={`coin-balance ${compact ? 'compact' : ''} ${updating ? 'is-updating' : ''} ${className || ''}`} title="Your balance">
      <img src={BalanceIcon} alt="Balance" className="balance-icon" />
      <span className="balance-text">
        {display} <span className={`tokens-text ${compact ? 'hidden' : ''}`}>tokens</span>
      </span>
    </div>
  );
};

export default CoinBalance;
