import React, { useEffect, useState } from 'react';
import { getMoveAnalysis, MoveAnalysis } from 'store/requests';
import './style.scss';

// Default stake options, matching those in BettingSidebar
const STAKE_OPTIONS = [10, 50, 100];

interface DragWagerSidebarProps {
  isVisible: boolean;
  moveString: string;
  gameState: string; // FEN position
  stake: number;
  onConfirm: () => void;
  onCancel: () => void;
  onChangeStake: (stake: number) => void;
}

const DragWagerSidebar: React.FC<DragWagerSidebarProps> = ({
  isVisible,
  moveString,
  gameState,
  stake,
  onConfirm,
  onCancel,
  onChangeStake,
}) => {
  const [moveMetrics, setMoveMetrics] = useState<MoveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch move analysis when move or position changes
  useEffect(() => {
    if (!isVisible || !moveString || !gameState) return;

    // Don't show loading state initially to avoid flickering if it fails
    setLoading(false);
    setError(null);

    // Try to get engine analysis, but don't block the UI on it
    getMoveAnalysis(gameState, moveString)
      .then(response => {
        if (response.status === 200) {
          setMoveMetrics(response.data);
        } else {
          // Silently fail
          setMoveMetrics(null);
        }
      })
      .catch(() => {
        // Silently fail, don't show error to user
        setMoveMetrics(null);
      });
  }, [isVisible, moveString, gameState]);

  if (!isVisible) return null;

  return (
    <div className="drag-wager-sidebar">
      <div className="sidebar-content">
        <h3>Place Bet on Move</h3>

        <div className="move-preview">
          <span className="move-label">Move:</span>
          <span className="move-value">{moveString}</span>
        </div>

        {/* Engine metrics section is now optional and will only appear if it works */}
        {moveMetrics && (
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
        )}

        <div className="stake-section">
          <h4>Wager Amount</h4>
          <div className="stake-buttons">
            {STAKE_OPTIONS.map((stakeOption) => (
              <button
                key={`stake-${stakeOption}`}
                className={`stake-button ${stake === stakeOption ? 'active' : ''}`}
                onClick={() => onChangeStake(stakeOption)}
              >
                {stakeOption}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
          <button className="confirm-button" onClick={onConfirm}>Place Bet</button>
        </div>
      </div>
    </div>
  );
};

export default DragWagerSidebar;