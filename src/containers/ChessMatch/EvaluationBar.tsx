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
const EvaluationBar: React.FC<EvaluationBarProps> = ({ odds, width = 30, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

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
    <div
      className={`vertical-evaluation-bar-container ${className}`}
    >
      {/* Main bar section */}
      <div
        className="vertical-evaluation-bar"
        style={{ width: `${width}px` }}
        onMouseEnter={() => setShowTooltip('main')}
        onMouseLeave={() => setShowTooltip(null)}
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

        {/* Overlay the label "Win %" on the bar when hovered */}
        {showTooltip === 'main' && (
          <div className="bar-tooltip">Win %</div>
        )}
      </div>

      {/* Side labels */}
      <div className="evaluation-labels">
        <div className="label-container">
          <span
            className="label black"
            title={`Black Win: ${blackPercent}%`}
            onMouseEnter={() => setShowTooltip('black')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {blackPercent}%
          </span>
          {showTooltip === 'black' && (
            <div className="label-tooltip black-tooltip">Black Win</div>
          )}
        </div>

        <div className="label-container" style={{ position: 'absolute', top: `${drawSectionMiddle}%`, transform: 'translateY(-50%)' }}>
          <span
            className="label draw"
            title={`Draw: ${drawPercent}%`}
            onMouseEnter={() => setShowTooltip('draw')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {drawPercent}%
          </span>
          {showTooltip === 'draw' && (
            <div className="label-tooltip draw-tooltip">Draw</div>
          )}
        </div>

        <div className="label-container">
          <span
            className="label white"
            title={`White Win: ${whitePercent}%`}
            onMouseEnter={() => setShowTooltip('white')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {whitePercent}%
          </span>
          {showTooltip === 'white' && (
            <div className="label-tooltip white-tooltip">White Win</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationBar;