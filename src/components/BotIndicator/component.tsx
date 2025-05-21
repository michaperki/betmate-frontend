import React, { FC } from 'react';
import './style.scss';

interface BotIndicatorProps {
  tooltipText?: string;
}

const BotIndicator: FC<BotIndicatorProps> = ({ tooltipText = 'Seed liquidity bot' }) => {
  return (
    <div className="bot-indicator" title={tooltipText}>
      <span className="bot-icon">⚙️</span>
    </div>
  );
};

export default BotIndicator;