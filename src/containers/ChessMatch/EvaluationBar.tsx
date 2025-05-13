import React from 'react';
import { GameOdds } from 'types/resources/game';

interface EvaluationBarProps {
  odds: GameOdds | undefined;
  width?: number;
  className?: string;
}

/**
 * Vertical evaluation bar showing the game win/draw probabilities
 */
const EvaluationBar: React.FC<EvaluationBarProps> = ({ odds, width = 30, className = '' }) => {
  // Default to even probabilities if odds are not available
  const whiteWinProb = odds?.white_win ?? 0.33;
  const drawProb = odds?.draw ?? 0.34;
  const blackWinProb = odds?.black_win ?? 0.33;

  // Format percentages for display
  const whitePercent = Math.round(whiteWinProb * 100);
  const drawPercent = Math.round(drawProb * 100);
  const blackPercent = Math.round(blackWinProb * 100);

  return (
    <div className={`vertical-evaluation-bar-container ${className}`}>
      <div className="vertical-evaluation-bar" style={{ width: `${width}px` }}>
        <div
          className="black-section"
          style={{ height: `${blackWinProb * 100}%` }}
          title={`Black: ${blackPercent}%`}
        />
        <div
          className="draw-section"
          style={{ height: `${drawProb * 100}%` }}
          title={`Draw: ${drawPercent}%`}
        />
        <div
          className="white-section"
          style={{ height: `${whiteWinProb * 100}%` }}
          title={`White: ${whitePercent}%`}
        />
      </div>

      <div className="evaluation-labels">
        <span className="label black" title={`Black: ${blackPercent}%`}>{blackPercent}%</span>
        <span className="label draw" title={`Draw: ${drawPercent}%`}>{drawPercent}%</span>
        <span className="label white" title={`White: ${whitePercent}%`}>{whitePercent}%</span>
      </div>
    </div>
  );
};

export default EvaluationBar;