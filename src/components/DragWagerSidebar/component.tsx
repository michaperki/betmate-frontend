import React from 'react';
import './style.scss';

// Default stake options, matching those in BettingSidebar
const STAKE_OPTIONS = [10, 50, 100];

interface DragWagerSidebarProps {
  isVisible: boolean;
  moveString: string;
  stake: number;
  onConfirm: () => void;
  onCancel: () => void;
  onChangeStake: (stake: number) => void;
}

const DragWagerSidebar: React.FC<DragWagerSidebarProps> = ({
  isVisible,
  moveString,
  stake,
  onConfirm,
  onCancel,
  onChangeStake,
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="drag-wager-sidebar">
      <div className="sidebar-content">
        <h3>Place Bet on Move</h3>
        
        <div className="move-preview">
          <span className="move-label">Move:</span>
          <span className="move-value">{moveString}</span>
        </div>
        
        {/* Move metrics section - can be expanded later */}
        <div className="move-metrics">
          <div className="metric">
            <div className="metric-label">Popularity</div>
            <div className="metric-value">
              <div className="metric-bar" style={{ width: '65%' }}></div>
            </div>
          </div>
          
          <div className="metric">
            <div className="metric-label">Engine Eval</div>
            <div className="metric-value">
              <div className="metric-bar" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>
        
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