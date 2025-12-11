import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTrophy } from '@fortawesome/free-solid-svg-icons';
import VersionTag from 'components/VersionTag';

interface BottomToolbarProps {
  selectedStake: number;
  onSelectStake: (value: number) => void;
  stakePresets: number[];
  viewerCount: number;
  onOpenChat: () => void;
  onOpenLeaderboard: () => void;
  isLive: boolean;
  // Draw action
  onDraw: () => void;
  drawState: 'idle' | 'loading' | 'success' | 'error';
  canDraw: boolean;
  pricingVersion?: string;
  // Real-mode info: optional draw percentage (0-100)
  isRealMode?: boolean;
  drawPct?: number;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  selectedStake,
  onSelectStake,
  stakePresets,
  viewerCount,
  onOpenChat,
  onOpenLeaderboard,
  isLive,
  onDraw,
  drawState,
  canDraw,
  pricingVersion,
  isRealMode,
  drawPct,
}) => {
  return (
    <div className="bottom-toolbar" role="region" aria-label="Match quick controls">
      <div className="bottom-toolbar__left">
        <span className={`live-pill ${isLive ? 'is-live' : 'is-paused'}`}>
          {isLive ? 'Live' : 'Not Live'}
        </span>
        {/* Desktop-only version tag (hidden on small screens) */}
        <span className="bt-version">
          <VersionTag ariaLabelPrefix="Frontend build" />
          {pricingVersion ? (
            <span style={{ marginLeft: 8, opacity: 0.7 }} title="Pricing model version">Pricing {pricingVersion}</span>
          ) : null}
        </span>
      </div>
      <div className="bottom-toolbar__center">
        <div className="stake-chip-row">
          {stakePresets.map((value) => (
            <button
              key={`bt-stake-${value}`}
              type="button"
              className={`stake-chip ${selectedStake === value ? 'is-active' : ''}`}
              onClick={() => onSelectStake(value)}
              aria-pressed={selectedStake === value}
              aria-label={`Set bet amount to $${value}`}
            >
              ${value}
            </button>
          ))}
        </div>
      </div>
      <div className="bottom-toolbar__right">
        <button
          type="button"
          className={`bt-draw-btn state-${drawState}`}
          onClick={onDraw}
          disabled={!canDraw || drawState === 'loading'}
          aria-label="Bet on Draw"
          aria-busy={drawState === 'loading'}
          title={isRealMode && typeof drawPct === 'number' && isFinite(drawPct)
            ? `Real market • Draw ${Math.round(drawPct)}%`
            : 'Bet Draw'}
        >
          <span className="bt-draw-btn__label">
            {isRealMode && typeof drawPct === 'number' && isFinite(drawPct)
              ? `Draw • ${Math.round(drawPct)}%`
              : 'Draw'}
          </span>
          <span className="bt-draw-btn__spinner" aria-hidden />
          <span className="bt-draw-btn__check" aria-hidden>✓</span>
        </button>
        <div className="bt-viewers" title="Viewers" aria-label="Viewers">
          <span className="bt-viewers__icon" aria-hidden>👁</span>
          <span className="bt-viewers__count">{viewerCount || 0}</span>
        </div>
        <button
          type="button"
          className="bt-icon-btn"
          onClick={onOpenChat}
          aria-label="Open chat"
          title="Open chat"
        >
          <FontAwesomeIcon icon={faComments} />
        </button>
        <button
          type="button"
          className="bt-icon-btn"
          onClick={onOpenLeaderboard}
          aria-label="Open leaderboard"
          title="Open leaderboard"
        >
          <FontAwesomeIcon icon={faTrophy} />
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
