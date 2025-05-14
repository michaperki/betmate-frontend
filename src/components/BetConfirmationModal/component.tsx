import React from 'react';
import './style.scss';

// Default stake options, matching those in BettingSidebar
const STAKE_OPTIONS = [10, 50, 100];

interface BetConfirmationModalProps {
  isOpen: boolean;
  moveString: string;
  stake: number;
  onConfirm: () => void;
  onCancel: () => void;
  onChangeStake: (stake: number) => void;
}

const BetConfirmationModal: React.FC<BetConfirmationModalProps> = ({
  isOpen,
  moveString,
  stake,
  onConfirm,
  onCancel,
  onChangeStake,
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="bet-confirmation-modal">
      <div className="modal-content">
        <h3>Confirm Your Bet</h3>
        <p>Bet {stake} tokens on move: <strong>{moveString}</strong></p>
        
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
        
        <div className="action-buttons">
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
          <button className="confirm-button" onClick={onConfirm}>Place Bet</button>
        </div>
      </div>
    </div>
  );
};

export default BetConfirmationModal;