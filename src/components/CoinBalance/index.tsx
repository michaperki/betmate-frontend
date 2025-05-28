import React from 'react';
import BalanceIcon from 'assets/wager_panel/balance-icon.svg';

import './style.scss';

interface CoinBalanceProps {
  balance: number | undefined;
  className?: string;
  compact?: boolean;
}

const CoinBalance: React.FC<CoinBalanceProps> = ({ balance, className, compact = false }) => {
  if (balance === undefined) return null;

  return (
    <div className={`coin-balance ${compact ? 'compact' : ''} ${className || ''}`}>
      <img src={BalanceIcon} alt="Balance" className="balance-icon" />
      <span className="balance-text">
        {Math.round(balance)} <span className={`tokens-text ${compact ? 'hidden' : ''}`}>tokens</span>
      </span>
    </div>
  );
};

export default CoinBalance;
