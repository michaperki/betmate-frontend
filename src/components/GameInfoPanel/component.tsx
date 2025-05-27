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
    <div className="bg-secondary border border-primary rounded py-1 px-2 sm:p-3">
      {/* Mobile: Stack vertically, Desktop: Keep horizontal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-6">
        {/* Top row on mobile: Game Stats - Compact */}
        <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 flex-wrap">
          <div className="text-center">
            <div className="text-xs text-muted uppercase leading-tight">Move</div>
            <div className="text-sm sm:text-lg font-bold text-brand leading-tight">{nextMoveNumber}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase leading-tight">👁 Watching</div>
            <div className="text-sm sm:text-lg font-bold text-primary leading-tight">{viewerCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase leading-tight">💰 Next Move</div>
            <div className="text-sm sm:text-lg font-bold text-success leading-tight">${currentMoveWagers.totalAmount}</div>
          </div>
        </div>

        {/* Middle row on mobile: Recent Move Bets - Compact */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-sm font-medium text-primary hidden sm:inline">Recent:</span>
          <span className="text-xs font-medium text-primary sm:hidden">Recent Moves:</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => {
              const moveNum = startMoveIndex + i + 1;
              const wagerData = moveWagerData[moveNum];
              const hasWagers = wagerData && wagerData.totalAmount > 0;
              const isCurrentMove = moveNum === currentMoveNumber;

              return (
                <div
                  key={moveNum}
                  className={`
                    w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-semibold border rounded
                    ${hasWagers ? 'bg-success border-success text-inverse' : 'bg-tertiary border-secondary text-muted'}
                    ${isCurrentMove ? 'ring-1 ring-brand' : ''}
                  `}
                  title={hasWagers ? `Move ${moveNum}: $${wagerData.totalAmount} (${wagerData.betCount} bets)` : `Move ${moveNum}: No bets`}
                >
                  <span className="text-xs sm:text-sm leading-none">{moveNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom row on mobile: Game Outcome Betting - Compact */}
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm font-medium text-primary">Outcome:</span>
          <div className="flex gap-2 sm:gap-3">
            <div className="text-center">
              <div className="text-xs text-muted uppercase">W</div>
              <div className="font-bold text-brand text-xs sm:text-sm">${whiteWinTotal.totalAmount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted uppercase">D</div>
              <div className="font-bold text-brand text-xs sm:text-sm">${drawTotal.totalAmount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted uppercase">B</div>
              <div className="font-bold text-brand text-xs sm:text-sm">${blackWinTotal.totalAmount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfoPanel;