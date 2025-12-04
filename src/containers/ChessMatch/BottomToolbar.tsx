import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTrophy } from '@fortawesome/free-solid-svg-icons';

interface BottomToolbarProps {
  selectedStake: number;
  onSelectStake: (value: number) => void;
  stakePresets: number[];
  viewerCount: number;
  onOpenChat: () => void;
  onOpenLeaderboard: () => void;
  isLive: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  selectedStake,
  onSelectStake,
  stakePresets,
  viewerCount,
  onOpenChat,
  onOpenLeaderboard,
  isLive,
}) => {
  return (
    <div className="bottom-toolbar" role="region" aria-label="Match quick controls">
      <div className="bottom-toolbar__left">
        <span className={`live-pill ${isLive ? 'is-live' : 'is-paused'}`}>
          {isLive ? 'Live' : 'Not Live'}
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
