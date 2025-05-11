import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Chess } from 'chess.js';
import { Game } from 'types/resources/game';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import {
  onEnterMovePanel,
  onLeaveMovePanel,
  onMoveHover,
  onMoveUnhover,
  createNewArrows,
} from 'store/actionCreators/chessgroundActionCreators';
import { Rank } from 'types/leaderboard';
import MiniLeaderboard from './MiniLeaderboard';

import './style.scss';

interface BettingSidebarProps {
  isAuthenticated: boolean;
  games: Record<string, Game>;
  createWager: typeof createWager;
  rankings: Rank[];
  tournamentId?: string;
  onEnterMovePanel?: typeof onEnterMovePanel;
  onLeaveMovePanel?: typeof onLeaveMovePanel;
  onMoveHover?: typeof onMoveHover;
  onMoveUnhover?: typeof onMoveUnhover;
  createNewArrows?: typeof createNewArrows;
}

const STAKE_OPTIONS = [10, 50, 100];

const BettingSidebar: React.FC<BettingSidebarProps> = ({
  isAuthenticated,
  games,
  createWager: placeBet,
  rankings,
  onEnterMovePanel: handleEnterMovePanel,
  onLeaveMovePanel: handleLeaveMovePanel,
  onMoveHover: handleMoveHover,
  onMoveUnhover: handleMoveUnhover,
  createNewArrows: handleCreateNewArrows,
}) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [selectedStake, setSelectedStake] = useState<number>(STAKE_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState<'move' | 'outcome'>('move');

  // Define game and moveOptions first to avoid "used before defined" errors
  const game = games[gameId];
  const moveOptions = game?.pool_wagers?.move?.options || [];

  // Trigger appropriate events when tab changes
  React.useEffect(() => {
    // First, make sure any existing arrows are cleared
    if (handleMoveUnhover) {
      handleMoveUnhover();
    }

    // Then trigger the appropriate panel entry/exit
    if (activeTab === 'move' && handleEnterMovePanel) {
      handleEnterMovePanel();

      // Ensure arrows are generated when the tab is active
      if (game && handleCreateNewArrows && game.pool_wagers?.move?.options) {
        handleCreateNewArrows(game.state, game.pool_wagers.move.options);
      }
    } else if (activeTab === 'outcome' && handleLeaveMovePanel) {
      handleLeaveMovePanel();
    }
  }, [activeTab, handleEnterMovePanel, handleLeaveMovePanel, handleMoveUnhover, handleCreateNewArrows, game]);

  // Generate arrows when game data becomes available and we're on the move tab
  React.useEffect(() => {
    if (activeTab === 'move' && game && handleCreateNewArrows && game.pool_wagers?.move?.options) {
      // Force a slight delay to ensure the state is ready
      setTimeout(() => {
        handleCreateNewArrows(game.state, game.pool_wagers.move.options);
      }, 100);
    }
  }, [game, handleCreateNewArrows, activeTab]);
  // Ensure moveOptions is properly typed
  const typedMoveOptions: Array<{ move: string; odds: number }> = Array.isArray(moveOptions)
    ? moveOptions.map((move) => (typeof move === 'string' ? { move, odds: 1 } : move))
    : [];
  const outcomeOptions = game?.odds || {};

  const handleBetMove = (moveOption: string) => () => {
    if (!isAuthenticated || !selectedStake) return;

    placeBet(
      gameId,
      moveOption,
      selectedStake,
      false, // not WDL
      1,
      game.move_hist.length + 1,
    );
  };

  const handleMovePieceHover = (moveOption: string) => () => {
    if (handleMoveHover && game) {
      const chess = new Chess(game.state);
      try {
        const moveObj = chess.move(moveOption, { sloppy: true });
        if (moveObj) {
          handleMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
        }
      } catch (e) {
        console.error('Invalid move', e);
      }
    }
  };

  const handleMovePieceUnhover = () => {
    if (handleMoveUnhover) {
      handleMoveUnhover();
    }
  };

  const handleBetOutcome = (outcome: string) => () => {
    if (!isAuthenticated || !selectedStake) return;

    placeBet(
      gameId,
      outcome,
      selectedStake,
      true, // is WDL
      1 / (outcomeOptions[outcome] || 1),
      game.move_hist.length + 1,
    );
  };

  const formatPayout = (odds: number) => {
    // Ensure odds is a valid number
    if (!odds || Number.isNaN(odds) || !Number.isFinite(odds)) {
      return '0.0';
    }
    // Calculate payout with numeric odds
    return (odds * selectedStake).toFixed(1);
  };

  return (
    <div className="betting-sidebar-container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'move' ? 'active' : ''}`}
          onClick={() => setActiveTab('move')}
        >
          Move
        </button>
        <button
          className={`tab-button ${activeTab === 'outcome' ? 'active' : ''}`}
          onClick={() => setActiveTab('outcome')}
        >
          Outcome
        </button>
      </div>

      {/* Content Panel */}
      <div className="tab-content">
        {activeTab === 'move' ? (
          /* Move Betting Panel */
          <>
            <div className="bet-explanation">
              Bet on which move will happen next. Win tokens from the pool.
            </div>

            <div className="options-container">
              {typedMoveOptions.length === 0 ? (
                <div className="no-options">
                  No moves available to bet on
                </div>
              ) : (
                <ul className="bet-options-list">
                  {typedMoveOptions
                    .filter((m) => m && m.move)
                    .map((m, i) => (
                      <li
                        key={`move-${m.move}-${i}`}
                        className="bet-option"
                        onClick={handleBetMove(m.move)}
                        onMouseEnter={handleMovePieceHover(m.move)}
                        onMouseLeave={handleMovePieceUnhover}
                      >
                        <span className="option-name">{m.move}</span>
                        <span className="option-payout">{formatPayout(m.odds)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          /* Outcome Betting Panel */
          <>
            <div className="bet-explanation">
              Bet on the outcome of the game. Win tokens from the house.
            </div>

            <div className="options-container">
              {!outcomeOptions || Object.keys(outcomeOptions).length === 0 ? (
                <div className="no-options">
                  No outcomes available to bet on
                </div>
              ) : (
                <ul className="bet-options-list">
                  {Object.entries(outcomeOptions).map(([outcome, odds]) => (
                    <li
                      key={`outcome-${outcome}`}
                      className={`bet-option outcome-${outcome}`}
                      onClick={handleBetOutcome(outcome)}
                    >
                      <span className="option-name">{outcome}</span>
                      <span className={`option-payout ${outcome === 'white' ? 'dark' : ''}`}>
                        {formatPayout(1 / (odds as number))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="stake-buttons">
          {STAKE_OPTIONS.map((stake) => (
            <button
              key={`stake-${stake}`}
              className={`stake-button ${selectedStake === stake ? 'active' : ''}`}
              onClick={() => setSelectedStake(stake)}
            >
              {stake}
            </button>
          ))}
        </div>

        <MiniLeaderboard rankings={rankings} />
      </div>
    </div>
  );
};

export default BettingSidebar;
