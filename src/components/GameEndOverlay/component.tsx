import React from 'react';
import { GameStatus } from 'types/resources/game';
import { Wager, WagerStatus } from 'types/resources/wager';
import { getGameEndMessage } from 'utils/chess';
import './style.scss';

interface GameEndOverlayProps {
  gameStatus: GameStatus;
  resolvedWagers?: Wager[]; // Make optional
  gameId: string;
  className?: string;
}

const GameEndOverlay: React.FC<GameEndOverlayProps> = ({
  gameStatus,
  resolvedWagers = [], // Provide default empty array
  gameId,
  className = '',
}) => {
  // Only calculate betting stats if we have wagers
  const hasBets = resolvedWagers && resolvedWagers.length > 0;

  // These calculations only run if we have wagers
  let profit = 0;
  let betsWon = 0;
  let totalBets = 0;

  if (hasBets) {
    // Calculate winnings
    const winnings = resolvedWagers
      .filter((wager) => wager.game_id === gameId && wager.status === WagerStatus.WON)
      .reduce((currWinnings, wager) => (
        currWinnings
          + (wager.amount
            * (
              (wager.wdl
                ? wager.odds
                : wager.winning_pool_share)
              - 1
            ))
      ), 0)
      .toFixed(2);

    // Calculate losses
    const losses = resolvedWagers
      .filter((wager) => wager.game_id === gameId && wager.status === WagerStatus.LOST)
      .reduce((loss, wager) => loss + wager.amount, 0)
      .toFixed(2);

    // Calculate net profit
    profit = Number(winnings) - Number(losses);

    // Count bets
    betsWon = resolvedWagers
      .filter((wager) => wager.game_id === gameId && wager.status === WagerStatus.WON)
      .length;

    totalBets = resolvedWagers
      .filter((wager) => wager.game_id === gameId)
      .length;
  }

  return (
    <div className={`game-end-overlay ${className}`}>
      {/* Game end message - always visible */}
      <div className="game-end-message">
        {getGameEndMessage(gameStatus)}
      </div>

      {/* Betting results - only if user placed bets */}
      {hasBets && totalBets > 0 && (
        <div className="betting-results">
          <div className="profit-display">
            <span className={profit >= 0 ? 'profit-positive' : 'profit-negative'}>
              {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
            </span>
          </div>

          <div className="bet-stats">
            <span className="bet-count">
              {betsWon}/{totalBets} bets won
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEndOverlay;