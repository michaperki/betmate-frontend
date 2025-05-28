import React from 'react';
import { FeedWager, WagerStatus } from 'types/resources/wager';
import { getMultiplier } from 'utils/chess';

interface WagerReceiptCardProps {
  wager: FeedWager;
}

const WagerReceiptCard: React.FC<WagerReceiptCardProps> = ({ wager }) => {
  // Handle case where status might be an array (defensive programming)
  const normalizedStatus = Array.isArray(wager.status)
    ? wager.status[0] || WagerStatus.PENDING
    : wager.status;

  // Format the timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Added to show when the wager was resolved (if it has been)
  const getStatusChangeTime = () => {
    if (wager.resolved) {
      const date = new Date(wager.updated_at);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return null;
  };

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
          icon: '🏆',
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
          label: 'Cancelled',
          icon: '⚠️',
          colorClass: 'status-cancelled'
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          colorClass: 'status-unknown'
        };
    }
  };

  const statusInfo = getStatusInfo(normalizedStatus as WagerStatus);
  
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

  // Calculate payout if won or potential payout
  const calculatePayout = () => {
    // For WDL (outcome bets), show potential payout for pending bets
    if (wager.wdl && normalizedStatus === WagerStatus.PENDING) {
      return (wager.amount * wager.odds).toFixed(2);
    }
    // For won bets (both move and WDL), show actual payout
    else if (normalizedStatus === WagerStatus.WON) {
      return (wager.amount * wager.odds).toFixed(2);
    }
    // For cancelled bets, show refund amount (original stake)
    else if (normalizedStatus === WagerStatus.CANCELLED) {
      return wager.amount.toFixed(2);
    }
    return null;
  };

  const payout = calculatePayout();

  const statusChangeTime = getStatusChangeTime();

  return (
    <div className={`wager-receipt-card ${statusInfo.colorClass}`}>
      <div className="receipt-content">
        <div className="bet-info">
          <span className="status-icon">{statusInfo.icon}</span>
          <span className="bet-description">{formatBetDescription()}</span>

          {/* Show when the wager was placed */}
          <span className="wager-time">{formatTime(wager.time)}</span>
        </div>

        <div className="bet-details">
          <div className="amount-staked">
            <span className="value">${wager.amount}</span>
          </div>

          {/* Only show odds for WDL (game outcome) bets */}
          {wager.wdl && (
            <div className="odds">
              <span className="value">{getMultiplier(wager.odds)}x</span>
            </div>
          )}

          {/* Show payout for WDL bets, won move bets, or cancelled bets (refunds) */}
          {payout && (wager.wdl || normalizedStatus === WagerStatus.WON || normalizedStatus === WagerStatus.CANCELLED) && (
            <div className={`potential-payout ${normalizedStatus === WagerStatus.CANCELLED ? "refund" : ""}`}>
              <span className="value">
                {normalizedStatus === WagerStatus.CANCELLED ? "Refund: $" : "$"}
                {payout}
              </span>
            </div>
          )}

          {/* For move bets that are pending, show "Pool" indicator instead of odds */}
          {!wager.wdl && normalizedStatus === WagerStatus.PENDING && (
            <div className="pool-indicator">
              <span className="value">Pool</span>
            </div>
          )}

          {/* Show pending indicator for pending wagers */}
          {normalizedStatus === WagerStatus.PENDING && (
            <div className="pending-dot">
              <div className="pulse-dot"></div>
            </div>
          )}

          {/* For resolved wagers, show when they were resolved */}
          {statusChangeTime && (
            <div className="status-change-time">
              <span className="value">
                {normalizedStatus === WagerStatus.WON ? '✓ ' : ''}
                {normalizedStatus === WagerStatus.LOST ? '✗ ' : ''}
                {normalizedStatus === WagerStatus.CANCELLED ? '⚠ ' : ''}
                {statusChangeTime}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WagerReceiptCard;