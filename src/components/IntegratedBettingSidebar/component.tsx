import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Chess } from 'chess.js';
import { getMoveAnalysis, MoveAnalysis } from 'store/requests';
import { Game } from 'types/resources/game';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { setPendingBet, clearPendingBet, toggleQuickBet } from 'store/actionCreators/gameActionCreators';
import {
  onEnterMovePanel,
  onLeaveMovePanel,
  onMoveHover,
  onMoveUnhover,
  createNewArrows,
} from 'store/actionCreators/chessgroundActionCreators';
import { Rank } from 'types/leaderboard';
import MiniLeaderboard from '../BettingSidebar/MiniLeaderboard';
import { VerticalBar } from '../WagerPanel/helper_components';
import { moveOptionColors } from 'utils/config';
import './style.scss';

// Default stake options, matching those in existing components
const STAKE_OPTIONS = [10, 50, 100];

interface IntegratedBettingSidebarProps {
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
  quickBetMode: boolean;
  toggleQuickBet: typeof toggleQuickBet;
  pendingBet: {
    moveString: string;
    stake: number;
    gameId: string;
    isActive: boolean;
  } | null;
  setPendingBet: typeof setPendingBet;
  clearPendingBet: typeof clearPendingBet;
  selectedStake?: number;
  setSelectedStake?: (stake: number) => void;
}

const IntegratedBettingSidebar: React.FC<IntegratedBettingSidebarProps> = ({
  isAuthenticated,
  games,
  createWager: placeBet,
  rankings,
  onEnterMovePanel: handleEnterMovePanel,
  onLeaveMovePanel: handleLeaveMovePanel,
  onMoveHover: handleMoveHover,
  onMoveUnhover: handleMoveUnhover,
  createNewArrows: handleCreateNewArrows,
  quickBetMode,
  toggleQuickBet,
  pendingBet,
  setPendingBet: setNewPendingBet,
  clearPendingBet,
  selectedStake: externalSelectedStake,
  setSelectedStake: externalSetSelectedStake,
}) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [internalSelectedStake, setInternalSelectedStake] = useState<number>(STAKE_OPTIONS[0]);

  // Use either external or internal state for stake
  const selectedStake = externalSelectedStake !== undefined ? externalSelectedStake : internalSelectedStake;
  const setSelectedStake = externalSetSelectedStake || setInternalSelectedStake;
  const [activeTab, setActiveTab] = useState<'move' | 'outcome'>('move');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hoveredMove, setHoveredMove] = useState<string | null>(null);
  const [moveMetrics, setMoveMetrics] = useState<MoveAnalysis | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // Define game
  const game = games[gameId];
  const moveOptions = game?.pool_wagers?.move?.options || [];
  const outcomeOptions = game?.odds || {};

  // First run initializes the component without triggering panel events
  useEffect(() => {
    setHasInitialized(true);
  }, []);

  // This effect is for cleaning up when switching tabs
  useEffect(() => {
    // Skip the effect on initial render
    if (!hasInitialized) return;

    // First, make sure any existing arrows are cleared
    if (handleMoveUnhover) {
      handleMoveUnhover();
    }

    // Only handle leaving the move panel when switching tabs
    if (activeTab === 'outcome' && handleLeaveMovePanel) {
      handleLeaveMovePanel();
    }

    // Don't automatically show arrows when switching to move tab
    // Arrows will only appear on mouse hover over specific moves
  }, [activeTab, handleLeaveMovePanel, handleMoveUnhover, hasInitialized]);

  // Fetch move analysis when hovered move changes
  useEffect(() => {
    if (!hoveredMove || !game?.state) return;

    setIsAnalysisLoading(true);
    // Get engine analysis for the hovered move
    getMoveAnalysis(game.state, hoveredMove)
      .then(response => {
        if (response.status === 200) {
          setMoveMetrics(response.data);
        } else {
          setMoveMetrics(null);
        }
      })
      .catch(() => {
        setMoveMetrics(null);
      })
      .finally(() => {
        setIsAnalysisLoading(false);
      });
  }, [hoveredMove, game?.state]);

  // Fetch move analysis for pending bet and show arrow
  useEffect(() => {
    if (!pendingBet?.isActive || !game?.state) {
      console.log('Pending bet effect - missing data:', {
        hasPendingBet: !!pendingBet,
        isActive: pendingBet?.isActive,
        hasGameState: !!game?.state
      });
      return;
    }

    // Only process if this pending bet is for the current game
    if (pendingBet.gameId === gameId) {
      console.log('Processing pending bet:', pendingBet.moveString);

      // Set hoveredMove to the pending bet move to show metrics
      setHoveredMove(pendingBet.moveString);

      // Show arrow on board for the pending bet
      if (handleMoveHover && game) {
        const chess = new Chess(game.state);
        try {
          console.log('Attempting to show arrow for pending bet:', pendingBet.moveString);
          const moveObj = chess.move(pendingBet.moveString, { sloppy: true });
          if (moveObj) {
            console.log('Pending bet arrow data:', { from: moveObj.from, to: moveObj.to });
            handleMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
          } else {
            console.error('Move object not created for pending bet:', pendingBet.moveString);
          }
        } catch (e) {
          console.error('Invalid move for pending bet:', e);
        }
      } else {
        console.log('Cannot show arrow for pending bet - missing handler:', !!handleMoveHover);
      }
    } else {
      console.log('Pending bet for different game:', pendingBet.gameId, gameId);
    }
  }, [pendingBet, game?.state, gameId, handleMoveHover]);

  // Ensure moveOptions is properly typed
  const typedMoveOptions: Array<{ move: string; odds: number }> = Array.isArray(moveOptions)
    ? moveOptions.map((move) => (typeof move === 'string' ? { move, odds: 1 } : move))
    : [];

  const handleBetMove = (moveOption: string) => () => {
    if (!isAuthenticated || !selectedStake) return;

    // Show arrow for the move regardless of bet mode
    if (handleMoveHover && game) {
      console.log('Attempting to show arrow for move:', moveOption);
      const chess = new Chess(game.state);
      try {
        const moveObj = chess.move(moveOption, { sloppy: true });
        if (moveObj) {
          console.log('Arrow data:', { from: moveObj.from, to: moveObj.to });
          handleMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
        } else {
          console.error('Move object not created for:', moveOption);
        }
      } catch (e) {
        console.error('Invalid move', e);
      }
    } else {
      console.log('Cannot show arrow - missing handler or game:', !!handleMoveHover, !!game);
    }

    if (quickBetMode) {
      // Place bet immediately if in quick bet mode
      placeBet(
        gameId,
        moveOption,
        selectedStake,
        false, // not WDL
        1,
        game.move_hist.length + 1,
      );

      // Set hoveredMove so the metrics stay visible briefly
      setHoveredMove(moveOption);

      // Clear the arrow after a short delay
      setTimeout(() => {
        setHoveredMove(null);
        setMoveMetrics(null);
        if (handleMoveUnhover) {
          handleMoveUnhover();
        }
      }, 1000);
    } else {
      // Set this as pending bet to show confirmation
      setNewPendingBet({
        moveString: moveOption,
        stake: selectedStake,
        gameId,
        isActive: true
      });
    }
  };

  const handleMovePieceHover = (moveOption: string) => () => {
    setHoveredMove(moveOption);
    
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
    // Always allow clearing of hover state when manually mousing away
  // We removed the pending bet check to ensure proper behavior

    setHoveredMove(null);
    setMoveMetrics(null);

    if (handleMoveUnhover) {
      handleMoveUnhover();
    }
  };

  const handleBetOutcome = (outcome: string) => () => {
    if (!isAuthenticated || !selectedStake) return;

    if (quickBetMode) {
      // Place bet immediately if in quick bet mode
      placeBet(
        gameId,
        outcome,
        selectedStake,
        true, // is WDL
        1 / (outcomeOptions[outcome] || 1),
        game.move_hist.length + 1,
      );

      // Set hoveredMove so metrics stay visible briefly
      setHoveredMove(outcome);

      // Clear the arrow after a short delay
      setTimeout(() => {
        setHoveredMove(null);
        setMoveMetrics(null);
        if (handleMoveUnhover) {
          handleMoveUnhover();
        }
      }, 1000);
    } else {
      // Set this as pending bet to show confirmation
      setNewPendingBet({
        moveString: outcome,
        stake: selectedStake,
        gameId,
        isActive: true
      });
    }
  };

  const formatPayout = (odds: number) => {
    // Ensure odds is a valid number
    if (!odds || Number.isNaN(odds) || !Number.isFinite(odds)) {
      return '0.0';
    }
    // Calculate payout with numeric odds
    return (odds * selectedStake).toFixed(1);
  };

  // Handle drop from drag-and-drop
  const handleDragBetConfirm = (moveString: string) => {
    if (!isAuthenticated || !selectedStake) return;

    placeBet(
      gameId,
      moveString,
      selectedStake,
      false, // not WDL
      1,
      game.move_hist.length + 1,
    );
  };

  // Render move options with pool distribution
  const renderMoveOptions = () => {
    if (!game?.pool_wagers?.move?.wagers) {
      return <div className="no-options">No moves available to bet on</div>;
    }

    const { options: rawOptions, wagers } = game.pool_wagers.move;

    if (!rawOptions || !wagers || rawOptions.length === 0) {
      return <div className="no-options">No moves available to bet on</div>;
    }

    // Format move options before processing
    const options = rawOptions.map((move) => {
      // Handle castling notation
      if (move === 'O-O' || move === 'O-O-O') return move;

      // Force lowercase for pawn moves (any move that doesn't start with NBRQK)
      const firstChar = move.charAt(0);
      if (!/^[NBRQK]/.test(firstChar)) {
        return move.toLowerCase();
      }

      // For piece moves, keep the piece letter uppercase and rest lowercase
      return firstChar + move.substring(1).toLowerCase();
    });

    const totalPool = wagers.reduce((acc, w) => acc + w.amount, 0);

    const poolPerMove: Record<string, number> = wagers.reduce((currObj, { amount, data }) => {
      // Only include wagers for options we know about
      if (options.includes(data)) {
        return {
          ...currObj,
          [data]: currObj[data] + amount,
        };
      }
      return currObj;
    }, {
      ...options.reduce((obj, move) => ({ ...obj, [move]: 0 }), {}),
    });

    const maxPercentage = (
      Object
        .values(poolPerMove)
        .reduce((currMax, movePool) => Math.max(currMax, movePool / totalPool), 0)
    );

    // Format move display - lowercase for pawn moves, uppercase for piece moves
    const formatMove = (move: string): string => {
      // Handle castling notation
      if (move === 'O-O' || move === 'O-O-O') return move;

      // Force lowercase for pawn moves (any move that doesn't start with NBRQK)
      const firstChar = move.charAt(0);
      if (!/^[NBRQK]/.test(firstChar)) {
        return move.toLowerCase();
      }

      // For piece moves, keep the piece letter uppercase and rest lowercase
      return firstChar + move.substring(1).toLowerCase();
    };

    // Get all moves
    const allMoves = Object.entries(poolPerMove);

    return allMoves.map(([move, movePool], i) => (
      <div
        key={move}
        className={`move-option ${isAuthenticated ? 'move-auth' : ''}
                  ${hoveredMove === move ? 'move-hovered' : ''}
                  ${pendingBet && pendingBet.isActive && pendingBet.moveString === formatMove(move) ? 'selected-bet' : ''}`}
        style={{ borderColor: isAuthenticated ? moveOptionColors[i % moveOptionColors.length] : 'grey' }}
        data-move={move}
        onMouseEnter={handleMovePieceHover(move)}
        onMouseLeave={handleMovePieceUnhover}
        onClick={handleBetMove(formatMove(move))}
      >
        <p>{formatMove(move)}</p>
        <span className="option-payout">{formatPayout(1)}</span>
      </div>
    ));
  };

  // Render outcome options
  const renderOutcomeOptions = () => {
    if (!outcomeOptions || Object.keys(outcomeOptions).length === 0) {
      return <div className="no-options">No outcomes available to bet on</div>;
    }

    return (
      <ul className="bet-options-list">
        {Object.entries(outcomeOptions).map(([outcome, odds]) => (
          <li
            key={`outcome-${outcome}`}
            className={`bet-option outcome-${outcome}`}
            onClick={handleBetOutcome(outcome)}
          >
            <span className="option-name">{outcome}</span>
            <span className="option-payout">
              {formatPayout(1 / (odds as number))}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="integrated-betting-sidebar">
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

        {/* Quick Bet Toggle */}
        {isAuthenticated && (
          <div className="quick-bet-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={quickBetMode}
                onChange={toggleQuickBet}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Quick Bet</span>
          </div>
        )}
      </div>

      {/* Content Panel */}
      <div className="tab-content">
        {activeTab === 'move' ? (
          /* Move Betting Panel */
          <div className="move-betting-panel">
            <div className="bet-explanation">
              Bet on which move will happen next. Win tokens from the pool.
            </div>

            {/* Move Analysis Section - always present with fixed height */}
            <div className="move-analysis-container">
              {hoveredMove ? (
                <div className="move-analysis">
                  <div className="move-preview">
                    <span className="move-label">Move:</span>
                    <span className="move-value">{hoveredMove}</span>
                  </div>

                  {isAnalysisLoading ? (
                    <div className="loading-metrics">Analyzing move...</div>
                  ) : moveMetrics ? (
                    <div className="move-metrics">
                      <div className="metric">
                        <div className="metric-header">
                          <div className="metric-label">Engine Quality</div>
                          {moveMetrics.is_best_move && (
                            <div className="metric-badge">Best Move</div>
                          )}
                        </div>
                        <div className="metric-value">
                          <div
                            className={`metric-bar ${moveMetrics.percentile > 70 ? 'high' :
                                                   moveMetrics.percentile > 40 ? 'medium' : 'low'}`}
                            style={{ width: `${moveMetrics.percentile}%` }}
                          ></div>
                        </div>
                        <div className="metric-description">
                          {moveMetrics.percentile > 90 ? 'Excellent move!' :
                           moveMetrics.percentile > 70 ? 'Strong move' :
                           moveMetrics.percentile > 40 ? 'Reasonable move' :
                           moveMetrics.percentile > 20 ? 'Dubious move' : 'Poor move'}
                        </div>
                      </div>

                      <div className="metric">
                        <div className="metric-label">Score: {Math.round(moveMetrics.score / 10) / 10}</div>
                        <div className="metric-description">
                          {moveMetrics.score > 200 ? 'Winning advantage' :
                           moveMetrics.score > 100 ? 'Clear advantage' :
                           moveMetrics.score > -100 ? 'Roughly equal' :
                           moveMetrics.score > -200 ? 'Worse position' : 'Losing position'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="placeholder-metrics">
                      Hover over a move to see analysis
                    </div>
                  )}
                </div>
              ) : (
                <div className="move-analysis-placeholder">
                  <div className="placeholder-text">Hover over a move to see analysis</div>
                </div>
              )}
            </div>

            {/* Display drag-and-drop instruction */}
            <div className="drag-instruction">
              {isAuthenticated ? "Drag pieces on the board to bet on a move" : "Sign in to place bets"}
            </div>

            {/* Move Options */}
            <div className="options-container">
              {renderMoveOptions()}
            </div>
          </div>
        ) : (
          /* Outcome Betting Panel */
          <div className="outcome-betting-panel">
            <div className="bet-explanation">
              Bet on the outcome of the game. Win tokens from the house.
            </div>

            <div className="options-container">
              {renderOutcomeOptions()}
            </div>
          </div>
        )}

        {/* Stake Selection - common to both tabs */}
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

        {/* Bet Confirmation Section - Only shown when not in quick bet mode and there's a pending bet */}
        {!quickBetMode && pendingBet?.isActive && pendingBet.gameId === gameId && (
          <div className="bet-confirmation-section">
            <div className="pending-bet-info">
              <span>Bet on: <strong>{pendingBet.moveString}</strong></span>
              <span>Amount: <strong>{pendingBet.stake}</strong></span>
            </div>
            <div className="confirmation-buttons">
              <button
                className="cancel-button"
                onClick={() => {
                  // First clear the hover state
                  setHoveredMove(null);
                  setMoveMetrics(null);

                  // Explicitly clear any arrows
                  if (handleMoveUnhover) {
                    handleMoveUnhover();
                  }

                  // Finally clear the pending bet state
                  clearPendingBet();
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={() => {
                  placeBet(
                    pendingBet.gameId,
                    pendingBet.moveString,
                    pendingBet.stake,
                    activeTab === 'outcome', // is WDL if on outcome tab
                    activeTab === 'outcome' ? 1 / (outcomeOptions[pendingBet.moveString] || 1) : 1,
                    game.move_hist.length + 1,
                  );

                  // Clear visual state
                  setHoveredMove(null);
                  setMoveMetrics(null);

                  // Clear pending bet state
                  clearPendingBet();

                  // Explicitly clear any arrows
                  if (handleMoveUnhover) {
                    handleMoveUnhover();
                  }
                }}
              >
                Confirm Bet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedBettingSidebar;