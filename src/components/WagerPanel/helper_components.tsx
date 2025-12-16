import React from 'react';
import { GameOdds } from 'types/resources/game';
import BotIndicator from 'components/BotIndicator';
import { useMode } from 'context/ModeContext';
import { realWdlMultiplier } from 'utils/realOdds';

interface VerticalBarProps {
  color: string,
  maxPercentage: number,
  percentage: number,
}

export const VerticalBar: React.FC<VerticalBarProps> = (props) => {
  return (
    <div className="vertical-bar-container">
      <div style={{
        height: (props.percentage && props.percentage !== 0) ? 35 * (props.percentage / props.maxPercentage) + 5 : 5,
        background: props.color,
      }} />
    </div>
  );
};

export const WDLProbability: React.FC<WDLBarProps> = (props) => {
  const { mode, risk } = useMode();
  const pWhite = props.odds?.white_win || 0;
  const pDraw = props.odds?.draw || 0;
  const pBlack = props.odds?.black_win || 0;
  const content = (mode === 'real')
    ? `white ${realWdlMultiplier('white_win', pWhite, undefined, risk as any).toFixed(2)}x / draw ${realWdlMultiplier('draw', pDraw, undefined, risk as any).toFixed(2)}x / black ${realWdlMultiplier('black_win', pBlack, undefined, risk as any).toFixed(2)}x`
    : `white ${Math.round(pWhite * 100)}% / draw ${Math.round(pDraw * 100)}% / black ${Math.round(pBlack * 100)}%`;
  return (
    <div>
      <p>{content}</p>
    </div>
  );
};

interface WDLBarProps {
  odds: GameOdds,
  height?: number,
  width?: number,
}

export const WDLBar: React.FC<WDLBarProps> = (props) => {
  return (
    <div className="wdl-bar-container" style={{ height: props.height }}>
      <div style={{ background: 'white', width: `${props.odds?.white_win * 100}%` }} />
      <div style={{ background: 'grey', width: `${props.odds?.draw * 100}%` }} />
      <div style={{ background: 'black', width: `${props.odds?.black_win * 100}%` }} />
    </div>
  );
};
