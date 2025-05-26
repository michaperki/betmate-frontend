import React from 'react';
import { Game } from 'types/resources/game';

interface GameInfoPanelProps {
  game: Game;
  viewerCount?: number;
  moveWagerData?: {
    [moveNumber: string]: {
      totalAmount: number;
      betCount: number;
    };
  };
  wdlWagerTotals?: {
    [outcome: string]: {
      totalAmount: number;
      betCount: number;
      averageOdds: number;
    };
  };
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({
  game,
  viewerCount = 0,
  moveWagerData = {},
  wdlWagerTotals = {}
}) => {
  const currentMoveNumber = game.move_hist?.length || 0;
  const nextMoveNumber = currentMoveNumber + 1; // Wagers are placed on the NEXT move
  const currentMoveWagers = moveWagerData[nextMoveNumber] || { totalAmount: 0, betCount: 0 };

  // Extract WDL totals
  const whiteWinTotal = wdlWagerTotals['white_win'] || { totalAmount: 0, betCount: 0, averageOdds: 0 };
  const blackWinTotal = wdlWagerTotals['black_win'] || { totalAmount: 0, betCount: 0, averageOdds: 0 };
  const drawTotal = wdlWagerTotals['draw'] || { totalAmount: 0, betCount: 0, averageOdds: 0 };

  // Get recent moves for betting indicators (last 5 moves)
  const recentMoves = game.move_hist?.slice(-5) || [];
  const startMoveIndex = Math.max(0, currentMoveNumber - 4);

  return (
    <div className="game-info-panel">
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">Move</span>
          <span className="stat-value">{nextMoveNumber}</span>
        </div>

        <div className="stat-item">
          <span className="stat-icon">👁</span>
          <span className="stat-value">{viewerCount}</span>
          <span className="stat-label">watching</span>
        </div>

        <div className="stat-item">
          <span className="stat-icon">💰</span>
          <span className="stat-value">${currentMoveWagers.totalAmount}</span>
          <span className="stat-label">next move</span>
        </div>
      </div>

      <div className="wdl-betting-stats">
        <span className="wdl-label">Game Outcome Betting:</span>
        <div className="wdl-stats-row">
          <div className="wdl-stat-item">
            <span className="wdl-outcome">White</span>
            <span className="wdl-amount">${whiteWinTotal.totalAmount}</span>
            {whiteWinTotal.averageOdds > 0 && (
              <span className="wdl-odds">{whiteWinTotal.averageOdds.toFixed(1)}x avg</span>
            )}
          </div>
          <div className="wdl-stat-item">
            <span className="wdl-outcome">Draw</span>
            <span className="wdl-amount">${drawTotal.totalAmount}</span>
            {drawTotal.averageOdds > 0 && (
              <span className="wdl-odds">{drawTotal.averageOdds.toFixed(1)}x avg</span>
            )}
          </div>
          <div className="wdl-stat-item">
            <span className="wdl-outcome">Black</span>
            <span className="wdl-amount">${blackWinTotal.totalAmount}</span>
            {blackWinTotal.averageOdds > 0 && (
              <span className="wdl-odds">{blackWinTotal.averageOdds.toFixed(1)}x avg</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="move-betting-indicators">
        <span className="indicators-label">Recent Move Bets:</span>
        <div className="move-indicators">
          {Array.from({ length: 5 }, (_, i) => {
            const moveNum = startMoveIndex + i + 1;
            const wagerData = moveWagerData[moveNum];
            const hasWagers = wagerData && wagerData.totalAmount > 0;
            const isCurrentMove = moveNum === currentMoveNumber;
            
            return (
              <div 
                key={moveNum}
                className={`move-indicator ${hasWagers ? 'has-wagers' : 'no-wagers'} ${isCurrentMove ? 'current' : ''}`}
                title={hasWagers ? `Move ${moveNum}: $${wagerData.totalAmount} (${wagerData.betCount} bets)` : `Move ${moveNum}: No bets`}
              >
                <span className="move-number">{moveNum}</span>
                {hasWagers && (
                  <div className="wager-indicator">
                    <div className="wager-amount">${wagerData.totalAmount}</div>
                    <div className="bet-count">{wagerData.betCount} bets</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameInfoPanel;