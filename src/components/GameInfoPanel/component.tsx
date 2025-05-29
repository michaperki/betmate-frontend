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
  selectedStake?: number;
  setSelectedStake?: (stake: number) => void;
}

// Default stake options, matching those in existing components
const STAKE_OPTIONS = [10, 50, 100];

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({
  game,
  viewerCount = 0,
  moveWagerData = {},
  selectedStake,
  setSelectedStake
}) => {
  const currentMoveNumber = game.move_hist?.length || 0;
  const nextMoveNumber = currentMoveNumber + 1; // Wagers are placed on the NEXT move
  const currentMoveWagers = moveWagerData[nextMoveNumber] || { totalAmount: 0, betCount: 0 };

  // We're no longer displaying the outcome betting section

  // Get recent moves for betting indicators (last 5 moves)
  const recentMoves = game.move_hist?.slice(-5) || [];
  const startMoveIndex = Math.max(0, currentMoveNumber - 4);

  return (
    <div className="bg-secondary border border-primary rounded py-1 px-2 sm:p-3">
      {/* Main info row */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-3">
        {/* Game Stats */}
        <div className="flex items-center gap-4 sm:gap-6">
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

        {/* Recent Move Bets */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium text-primary hidden sm:inline">Recent:</span>
          <span className="text-xs font-medium text-primary sm:hidden">Recent:</span>
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
      </div>

      {/* Wager Sizing Buttons */}
      {selectedStake !== undefined && setSelectedStake && (
        <div className="bg-tertiary border border-secondary rounded py-2 px-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">Bet Amount:</span>
            <div className="flex gap-2">
              {STAKE_OPTIONS.map((stake) => (
                <button
                  key={`stake-${stake}`}
                  className={`
                    px-3 py-1 text-sm font-semibold rounded border transition-colors
                    ${selectedStake === stake
                      ? 'bg-brand border-brand text-inverse'
                      : 'bg-secondary border-secondary text-primary hover:bg-tertiary hover:border-primary'
                    }
                  `}
                  onClick={() => setSelectedStake(stake)}
                >
                  {stake}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInfoPanel;