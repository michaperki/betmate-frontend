import React, { useState, useEffect } from 'react';
import { useOddsFormat } from 'context/OddsFormatContext';
import { formatAmountShort, formatNet } from 'utils/currency';
import './style.scss';

// Export interface so it can be imported elsewhere
export interface BetItem {
  id: string;
  type: string;
  odds: number;
  stake: number;
  result?: 'won' | 'lost' | 'pending' | 'cancelled';
  profit?: number;
  currency?: 'USDT' | 'BET';
}

interface BettingPanelProps {
  bets: BetItem[];
  gameEnded?: boolean;
  showSummary?: boolean;
  onCashOut?: (betId: string) => void;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  bets,
  gameEnded = false,
  showSummary = false,
  onCashOut
}) => {
  // Calculate summary metrics
  const { formatOdds } = useOddsFormat();
  // Summaries per currency for clarity if mixed
  const totals = bets.reduce((acc, b) => {
    const c = (b.currency || 'USDT') as 'USDT' | 'BET';
    acc[c].staked += b.stake;
    if (b.result === 'won') acc[c].won += b.stake * b.odds;
    return acc;
  }, { USDT: { staked: 0, won: 0 }, BET: { staked: 0, won: 0 } } as Record<'USDT' | 'BET', { staked: number; won: number }>);
  const nets: Record<'USDT' | 'BET', number> = {
    USDT: totals.USDT.won - totals.USDT.staked,
    BET: totals.BET.won - totals.BET.staked,
  };
  
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
            data-currency={bet.currency || 'USDT'}
            style={{ borderLeft: `3px solid ${bet.currency === 'BET' ? 'rgb(var(--accent-arcade-rgb))' : 'rgb(var(--accent-real-rgb))'}` }}
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
                <span className="betting-panel__bet-stake">{formatAmountShort(bet.stake, (bet.currency || 'USDT') as any)}</span>
                <span className="betting-panel__bet-odds">{formatOdds(bet.odds)}</span>
                <div className={`betting-panel__bet-result betting-panel__bet-result--${bet.result || 'pending'}`}>
                  {bet.result === 'won' && bet.profit !== undefined && 
                    `${formatNet(Math.abs(bet.profit), (bet.currency || 'USDT') as any)}`}
                  {bet.result === 'lost' && 
                    `${formatNet(-Math.abs(bet.stake), (bet.currency || 'USDT') as any)}`}
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
            {totals.USDT && (
              <>
                <div className="betting-panel__summary-row">
                  <span className="betting-panel__summary-label">Total Staked (Cash)</span>
                  <span className="betting-panel__summary-value">{formatAmountShort(totals.USDT.staked, 'USDT')}</span>
                </div>
                <div className="betting-panel__summary-row">
                  <span className="betting-panel__summary-label">Total Won (Cash)</span>
                  <span className="betting-panel__summary-value betting-panel__summary-value--won">
                    {formatAmountShort(totals.USDT.won, 'USDT')}
                  </span>
                </div>
              </>
            )}
            {totals.BET && (
              <>
                <div className="betting-panel__summary-row">
                  <span className="betting-panel__summary-label">Total Staked (K-Bits)</span>
                  <span className="betting-panel__summary-value">{formatAmountShort(totals.BET.staked, 'BET')}</span>
                </div>
                <div className="betting-panel__summary-row">
                  <span className="betting-panel__summary-label">Total Won (K-Bits)</span>
                  <span className="betting-panel__summary-value betting-panel__summary-value--won">
                    {formatAmountShort(totals.BET.won, 'BET')}
                  </span>
                </div>
              </>
            )}
            <div className="betting-panel__summary-divider"></div>
            {nets.USDT !== undefined && (
              <div className="betting-panel__summary-row betting-panel__summary-row--total">
                <span className="betting-panel__summary-label betting-panel__summary-label--bold">Net Profit (Cash)</span>
                <span className={`betting-panel__summary-value betting-panel__summary-value--${(nets.USDT || 0) >= 0 ? 'positive' : 'negative'} betting-panel__summary-value--large`}>
                  {formatNet(nets.USDT || 0, 'USDT')}
                </span>
              </div>
            )}
            {nets.BET !== undefined && (
              <div className="betting-panel__summary-row betting-panel__summary-row--total">
                <span className="betting-panel__summary-label betting-panel__summary-label--bold">Net Profit (K-Bits)</span>
                <span className={`betting-panel__summary-value betting-panel__summary-value--${(nets.BET || 0) >= 0 ? 'positive' : 'negative'} betting-panel__summary-value--large`}>
                  {formatNet(nets.BET || 0, 'BET')}
                </span>
              </div>
            )}
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
