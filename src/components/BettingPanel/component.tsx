import React, { useState, useEffect } from 'react';
import './style.scss';

// Export interface so it can be imported elsewhere
export interface BetItem {
  id: string;
  type: string;
  odds: number;
  stake: number;
  result?: 'won' | 'lost' | 'pending' | 'cancelled';
  profit?: number;
}

interface BettingPanelProps {
  bets: BetItem[];
  currency?: 'USDT' | 'KBITZ';
  gameEnded?: boolean;
  showSummary?: boolean;
  onCashOut?: (betId: string) => void;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  bets,
  currency = 'USDT',
  gameEnded = false,
  showSummary = false,
  onCashOut
}) => {
  // Calculate summary metrics
  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalWon = bets
    .filter(bet => bet.result === 'won')
    .reduce((sum, bet) => sum + bet.stake * bet.odds, 0);
  const netProfit = totalWon - totalStaked;
  
  // Calculate win streak
  const [winStreak, setWinStreak] = useState(0);
  
  useEffect(() => {
    let streak = 0;
    // Count consecutive won bets from most recent
    for (let i = bets.length - 1; i >= 0; i--) {
      if (bets[i].result === 'won') streak++;
      else if (bets[i].result === 'lost') break;
    }
    setWinStreak(streak);
  }, [bets]);

  return (
    <div className="betting-panel">
      <div className="betting-panel__header">Your Bets</div>
      
      <div className="betting-panel__bets">
        {bets.map(bet => (
          <div 
            key={bet.id} 
            className={`betting-panel__bet betting-panel__bet--${bet.result || 'pending'}`}
          >
            <div className="betting-panel__bet-info">
              <div className="betting-panel__bet-type">
                <span className="betting-panel__bet-indicator" 
                      data-type={bet.type.includes('black') ? 'black' : 
                                bet.type.includes('white') ? 'white' : 'move'}>
                </span>
                <span className={`betting-panel__bet-label ${gameEnded && bet.result === 'lost' ? 'betting-panel__bet-label--lost' : ''}`}>
                  {bet.type}
                </span>
              </div>
              <div className="betting-panel__bet-details">
                <span className="betting-panel__bet-stake">${bet.stake.toFixed(2)}</span>
                <span className="betting-panel__bet-odds">x{bet.odds.toFixed(2)}</span>
                <div className={`betting-panel__bet-result betting-panel__bet-result--${bet.result || 'pending'}`}>
                  {bet.result === 'won' && bet.profit !== undefined && 
                    `+$${bet.profit.toFixed(2)}`}
                  {bet.result === 'lost' && 
                    `-$${bet.stake.toFixed(2)}`}
                  {(!bet.result || bet.result === 'pending') && 'Pending'}
                  {bet.result === 'cancelled' && 'Refunded'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showSummary && (
        <div className="betting-panel__summary">
          <div className="betting-panel__summary-header">Game Summary</div>
          
          <div className="betting-panel__summary-stats">
            <div className="betting-panel__summary-row">
              <span className="betting-panel__summary-label">Total Staked</span>
              <span className="betting-panel__summary-value">${totalStaked.toFixed(2)}</span>
            </div>
            <div className="betting-panel__summary-row">
              <span className="betting-panel__summary-label">Total Won</span>
              <span className="betting-panel__summary-value betting-panel__summary-value--won">
                ${totalWon.toFixed(2)}
              </span>
            </div>
            <div className="betting-panel__summary-divider"></div>
            <div className="betting-panel__summary-row betting-panel__summary-row--total">
              <span className="betting-panel__summary-label betting-panel__summary-label--bold">
                Net Profit
              </span>
              <span className={`betting-panel__summary-value betting-panel__summary-value--${netProfit >= 0 ? 'positive' : 'negative'} betting-panel__summary-value--large`}>
                {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
              </span>
            </div>
          </div>
          
          {winStreak > 2 && (
            <div className="betting-panel__streak">
              <span className="betting-panel__streak-emoji">🔥</span>
              <span className="betting-panel__streak-text">
                {winStreak} game win streak!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
