import React from 'react';
import BalanceIcon from 'assets/wager_panel/balance-icon.svg';

import './style.scss';

interface CoinBalanceProps {
  balance: number | undefined;
  className?: string;
}

const CoinBalance: React.FC<CoinBalanceProps> = ({ balance, className }) => {
  if (balance === undefined) return null;

  return (
    <div className={`coin-balance ${className || ''}`}>
      <img src={BalanceIcon} alt="Balance" className="balance-icon" />
      <span className="balance-text">
        {balance.toFixed(2)} <span className="tokens-text">tokens</span>
      </span>
    </div>
  );
};

export default CoinBalance;
