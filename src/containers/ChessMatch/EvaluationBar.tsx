import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="black-section"
          style={{ height: `${blackWinProb * 100}%` }}
          title={`Black Win: ${blackPercent}%`}
        />
        <div
          className="draw-section"
          style={{ height: `${drawProb * 100}%` }}
          title={`Draw: ${drawPercent}%`}
        />
        <div
          className="white-section"
          style={{ height: `${whiteWinProb * 100}%` }}
          title={`White Win: ${whitePercent}%`}
        />

        {/* Overlay the current odds tooltip when hovered */}
        {isHovered && (
          <div className="odds-tooltip" role="tooltip" aria-label="Current odds">
            <div className="odds-row odds-row--black">Black {blackPercent}%</div>
            <div className="odds-row odds-row--draw">Draw {drawPercent}%</div>
            <div className="odds-row odds-row--white">White {whitePercent}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationBar;
