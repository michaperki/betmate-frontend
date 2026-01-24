import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTrophy } from '@fortawesome/free-solid-svg-icons';
import VersionTag from 'components/VersionTag';
import { useMode } from 'context/ModeContext';
import { currencySymbol, modeCurrency } from 'utils/currency';
import { getMultiplier } from 'utils/chess';

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
  // Real-mode info: optional draw multiplier (capped) for display
  drawMult?: number;
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
  drawMult,
}) => {
  const { mode } = useMode();
  const sym = currencySymbol(modeCurrency(mode));
  return (
    <div className="bottom-toolbar" role="region" aria-label="Match quick controls" data-tour-id="bottom-toolbar">
      <div className="bottom-toolbar__left">
        <span className={`live-pill ${isLive ? 'is-live' : 'is-paused'}`}>
          {isLive ? 'Live' : 'Not Live'}
        </span>
        {/* Desktop-only version tag (hidden on small screens) */}
        <span className="bottom-toolbar__version">
          <VersionTag ariaLabelPrefix="Frontend build" />
          {pricingVersion ? (
            <span style={{ marginLeft: 8, opacity: 0.7 }} title="Pricing model version">Pricing {pricingVersion}</span>
          ) : null}
        </span>
      </div>
      <div className="bottom-toolbar__center">
        <div className="bottom-toolbar__stake-row">
          {stakePresets.map((value) => (
            <button
              key={`bt-stake-${value}`}
              type="button"
              className={`bottom-toolbar__stake-chip ${selectedStake === value ? 'is-active' : ''}`}
              onClick={() => onSelectStake(value)}
              aria-pressed={selectedStake === value}
              aria-label={`Set bet amount to ${sym}${value}`}
            >
              {sym}{value}
            </button>
          ))}
        </div>
      </div>
      <div className="bottom-toolbar__right">
        <button
          data-tour-id="draw-button"
          type="button"
          className={`bottom-toolbar__draw-btn state-${drawState}`}
          onClick={onDraw}
          disabled={!canDraw || drawState === 'loading'}
          aria-label="Bet on Draw"
          aria-busy={drawState === 'loading'}
          title={isRealMode && typeof drawMult === 'number' && isFinite(drawMult)
            ? `Real odds • Draw ${getMultiplier(drawMult)}x`
            : 'Bet Draw'}
        >
          <span className="bottom-toolbar__draw-btn__label">
            {isRealMode && typeof drawMult === 'number' && isFinite(drawMult)
              ? `Draw • ${getMultiplier(drawMult)}x`
              : 'Draw'}
          </span>
          <span className="bottom-toolbar__draw-btn__spinner" aria-hidden />
          <span className="bottom-toolbar__draw-btn__check" aria-hidden>✓</span>
        </button>
        <div className="bottom-toolbar__viewers" title="Viewers" aria-label="Viewers">
          <span className="bottom-toolbar__viewers-icon" aria-hidden>👁</span>
          <span className="bottom-toolbar__viewers-count">{viewerCount || 0}</span>
        </div>
        <button
          type="button"
          className="bottom-toolbar__icon-btn"
          onClick={onOpenChat}
          aria-label="Open chat"
          title="Open chat"
        >
          <FontAwesomeIcon icon={faComments} />
        </button>
        <button
          type="button"
          className="bottom-toolbar__icon-btn"
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