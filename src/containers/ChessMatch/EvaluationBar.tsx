import React, { useState } from 'react';
// NOTE: Do not re-use this legacy component in new mock pages.
import { GameOdds } from 'types/resources/game';

interface EvaluationBarProps {
  odds: GameOdds | undefined;
  width?: number;
  className?: string;
}

/**
 * Vertical evaluation bar showing the game win/draw probabilities
 */
const EvaluationBar: React.FC<EvaluationBarProps> = ({ odds, width, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false); // retained for potential future use

  // Default to even probabilities if odds are not available
  const whiteWinProb = odds?.white_win ?? 0.33;
  const drawProb = odds?.draw ?? 0.34;
  const blackWinProb = odds?.black_win ?? 0.33;

  // Format percentages for display
  const whitePercent = Math.round(whiteWinProb * 100);
  const drawPercent = Math.round(drawProb * 100);
  const blackPercent = Math.round(blackWinProb * 100);

  // Calculate the center position of the draw section
  const drawSectionStart = blackWinProb * 100; // % from the top
  const drawSectionMiddle = drawSectionStart + (drawProb * 100) / 2; // % from the top to the middle of draw

  return (
    <div className={`vertical-evaluation-bar-container ${className}`}>
      {/* Main bar section */}
      <div
        className="vertical-evaluation-bar"
        style={width ? { width: `${width}px` } : {}}
      >
        <div className="black-section" style={{ height: `${blackWinProb * 100}%` }}>
          <span className="section-percent">{blackPercent}%</span>
        </div>
        <div className="draw-section" style={{ height: `${drawProb * 100}%` }}>
          <span className="section-percent">{drawPercent}%</span>
        </div>
        <div className="white-section" style={{ height: `${whiteWinProb * 100}%` }}>
          <span className="section-percent">{whitePercent}%</span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationBar;
