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
    <div className="bg-secondary border border-primary rounded p-3">
      <div className="flex items-center justify-between gap-6">
        {/* Game Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Move</div>
            <div className="text-lg font-bold text-brand">{nextMoveNumber}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase">👁 Watching</div>
            <div className="text-lg font-bold text-primary">{viewerCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase">💰 Next Move</div>
            <div className="text-lg font-bold text-success">${currentMoveWagers.totalAmount}</div>
          </div>
        </div>

        {/* Recent Move Bets */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">Recent:</span>
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
                    w-8 h-8 flex items-center justify-center text-xs font-semibold border rounded
                    ${hasWagers ? 'bg-success border-success text-inverse' : 'bg-tertiary border-secondary text-muted'}
                    ${isCurrentMove ? 'ring-1 ring-brand' : ''}
                  `}
                  title={hasWagers ? `Move ${moveNum}: $${wagerData.totalAmount} (${wagerData.betCount} bets)` : `Move ${moveNum}: No bets`}
                >
                  {moveNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Outcome Betting */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-primary">Outcome:</span>
          <div className="flex gap-2">
            <div className="text-center">
              <div className="text-xs text-muted uppercase">White</div>
              <div className="font-bold text-brand text-sm">${whiteWinTotal.totalAmount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted uppercase">Draw</div>
              <div className="font-bold text-brand text-sm">${drawTotal.totalAmount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted uppercase">Black</div>
              <div className="font-bold text-brand text-sm">${blackWinTotal.totalAmount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfoPanel;