import React from 'react';
import { FeedWager, WagerStatus } from 'types/resources/wager';
import { getMultiplier } from 'utils/chess';
import { formatAmount, formatNet } from 'utils/currency';

interface WagerReceiptCardProps {
  wager: FeedWager;
}

const WagerReceiptCard: React.FC<WagerReceiptCardProps> = ({ wager }) => {
  // Handle case where status might be an array (defensive programming)
  const normalizedStatus = Array.isArray(wager.status)
    ? wager.status[0] || WagerStatus.PENDING
    : wager.status;

  // Get display elements based on status
  const getStatusInfo = (status: WagerStatus) => {
    switch (status) {
      case WagerStatus.PENDING:
        return {
          label: 'Pending',
          icon: '⏳',
          colorClass: 'status-pending'
        };
      case WagerStatus.WON:
        return {
          label: 'Won',
          icon: '✅',
          colorClass: 'status-won'
        };
      case WagerStatus.LOST:
        return {
          label: 'Lost',
          icon: '❌',
          colorClass: 'status-lost'
        };
      case WagerStatus.CANCELLED:
        return {
          label: 'Refund',
          icon: '↩️',
          colorClass: 'status-cancelled'
        };
      default:
        return {
          label: 'Unknown',
          icon: '•',
          colorClass: 'status-unknown'
        };
    }
  };

  const statusInfo = getStatusInfo(normalizedStatus as WagerStatus);
  const isReal = (wager as any).mode === 'real';
  const currency: 'BET' | 'USDT' = ((wager as any).currency as any) || (isReal ? 'USDT' : 'BET');
  const typeIcon = wager.wdl ? '🏁' : '🎯';
  
  // Format the bet description more clearly
  const formatBetDescription = () => {
    if (wager.wdl) {
      // Game outcome bet (WDL = Win/Draw/Loss)
      const outcomeMap: Record<string, string> = {
        'white_win': 'White to win',
        'black_win': 'Black to win',
        'draw': 'Game to draw'
      };
      return outcomeMap[wager.data] || wager.data;
    } else {
      // Move bet
      return `Move: ${wager.data}`;
    }
  };

  // Calculate compact net result (minimal, non-flashy)
  const calculateNet = () => {
    if (normalizedStatus === WagerStatus.WON) {
      // WDL: both Arcade and Real use fixed odds at bet-time
      if (wager.wdl) {
        const mult = wager.odds;
        return (wager.amount * mult - wager.amount);
      }
      // Move: Arcade uses fixed odds; Real uses pool share
      const isRealMove = ((wager as any).mode === 'real');
      const mult = isRealMove ? (wager.winning_pool_share || 0) : (wager.odds || 1);
      return (wager.amount * mult - wager.amount);
    }
    if (normalizedStatus === WagerStatus.LOST) {
      return -wager.amount;
    }
    if (normalizedStatus === WagerStatus.CANCELLED) {
      return 0;
    }
    return null;
  };

  const net = calculateNet();

  return (
    <div className={`wager-receipt-card ${statusInfo.colorClass}`} data-testid="receipt-card">
      <div className="receipt-content">
        <div className="bet-info">
          <span className="status-icon" aria-hidden>{typeIcon}</span>
          <span className="bet-description">{formatBetDescription()}</span>
        </div>

        <div className="bet-details">
          <div className="amount-staked"><span className="value">{formatAmount(wager.amount, currency)}</span></div>

          {/* No explicit REAL label; panel should filter by mode */}

          {/* WDL payout label — skip showing raw 1x for pending */}
          {wager.wdl && (
            <div className="odds">
              <span className="value">{getMultiplier(wager.odds)}x</span>
            </div>
          )}

          {/* Net result: won/lost/cancelled only (no pending) */}
          {net !== null && (
            <div className={`net ${net >= 0 ? 'net-positive' : 'net-negative'}`}>
              <span className="value">{formatNet(net, currency)}</span>
            </div>
          )}

          {/* Compact status badge */}
          <div className={`status-badge status-badge--${normalizedStatus}`} title={statusInfo.label}>
            <span className="value">{statusInfo.icon} {statusInfo.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WagerReceiptCard;
