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
    <div className="bg-secondary border border-primary rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left section: Move info and recent move indicators */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-xs text-muted uppercase mb-1">Move</div>
              <div className="text-xl font-bold text-brand">{nextMoveNumber}</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-muted uppercase mb-1">👁 Watching</div>
              <div className="text-xl font-bold text-primary">{viewerCount}</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-muted uppercase mb-1">💰 Next Move</div>
              <div className="text-xl font-bold text-success">${currentMoveWagers.totalAmount}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-primary mb-2">Recent Move Bets:</div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, i) => {
                const moveNum = startMoveIndex + i + 1;
                const wagerData = moveWagerData[moveNum];
                const hasWagers = wagerData && wagerData.totalAmount > 0;
                const isCurrentMove = moveNum === currentMoveNumber;

                return (
                  <div
                    key={moveNum}
                    className={`
                      relative flex-1 p-2 text-center border rounded text-xs
                      ${hasWagers ? 'bg-success border-success text-inverse' : 'bg-tertiary border-secondary text-muted'}
                      ${isCurrentMove ? 'ring-2 ring-brand' : ''}
                    `}
                    title={hasWagers ? `Move ${moveNum}: $${wagerData.totalAmount} (${wagerData.betCount} bets)` : `Move ${moveNum}: No bets`}
                  >
                    <div className="font-semibold">{moveNum}</div>
                    {hasWagers && (
                      <div className="mt-1">
                        <div className="font-bold">${wagerData.totalAmount}</div>
                        <div className="opacity-80">{wagerData.betCount} bets</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right section: Game outcome betting */}
        <div>
          <div className="text-sm font-medium text-primary mb-3">Game Outcome Betting:</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-tertiary rounded">
              <span className="font-medium text-primary">White Win</span>
              <div className="text-right">
                <div className="font-bold text-brand">${whiteWinTotal.totalAmount}</div>
                {whiteWinTotal.averageOdds > 0 && (
                  <div className="text-xs text-secondary">{whiteWinTotal.averageOdds.toFixed(1)}x avg</div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center p-2 bg-tertiary rounded">
              <span className="font-medium text-primary">Draw</span>
              <div className="text-right">
                <div className="font-bold text-brand">${drawTotal.totalAmount}</div>
                {drawTotal.averageOdds > 0 && (
                  <div className="text-xs text-secondary">{drawTotal.averageOdds.toFixed(1)}x avg</div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center p-2 bg-tertiary rounded">
              <span className="font-medium text-primary">Black Win</span>
              <div className="text-right">
                <div className="font-bold text-brand">${blackWinTotal.totalAmount}</div>
                {blackWinTotal.averageOdds > 0 && (
                  <div className="text-xs text-secondary">{blackWinTotal.averageOdds.toFixed(1)}x avg</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfoPanel;