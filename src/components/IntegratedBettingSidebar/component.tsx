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
  createArrows,
} from 'store/actionCreators/chessgroundActionCreators';
import './style.scss';


interface IntegratedBettingSidebarProps {
  isAuthenticated: boolean;
  games: Record<string, Game>;
  onEnterMovePanel?: typeof onEnterMovePanel;
  onLeaveMovePanel?: typeof onLeaveMovePanel;
  onMoveHover?: typeof onMoveHover;
  onMoveUnhover?: typeof onMoveUnhover;
  pendingBet: {
    moveString: string;
    stake: number;
    gameId: string;
    isActive: boolean;
  } | null;
}

const IntegratedBettingSidebar: React.FC<IntegratedBettingSidebarProps> = ({
  isAuthenticated,
  games,
  onEnterMovePanel: handleEnterMovePanel,
  onLeaveMovePanel: handleLeaveMovePanel,
  onMoveHover: handleMoveHover,
  onMoveUnhover: handleMoveUnhover,
  pendingBet,
}) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [hoveredMove, setHoveredMove] = useState<string | null>(null);
  const [moveMetrics, setMoveMetrics] = useState<MoveAnalysis | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // Define game
  const game = games[gameId];


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





  return (
    <div className="integrated-betting-sidebar">
      {/* Header */}
      <div className="panel-header">
        <h3>Move Analysis</h3>
      </div>

      {/* Content Panel - Only Analysis */}
      <div className="content-panel">
        <div className="analysis-panel">
          <div className="panel-explanation">
            Tap move bubbles below to see detailed analysis and place bets.
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
                    Tap a move bubble to see detailed analysis
                  </div>
                )}
              </div>
            ) : (
              <div className="move-analysis-placeholder">
                <div className="placeholder-text">Tap a move bubble to see detailed analysis</div>
              </div>
            )}
          </div>

          {/* Instruction */}
          <div className="instruction">
            <strong>How to bet:</strong><br/>
            • Tap move bubble to show arrow<br/>
            • Hold move bubble to place bet<br/>
            • Drag pieces on board to bet
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedBettingSidebar;
