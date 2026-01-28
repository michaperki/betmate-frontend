import React from 'react';
import './style.scss';

interface PlayerHeaderProps {
  side: 'white' | 'black';
  name: string;
  rating: number;
  time: string; // Format: "MM:SS"
  isWinner?: boolean;
  isActive?: boolean;
  lowTime?: boolean; // For red highlight on low time
  onOutcomeClick?: () => void;
  status?: 'idle' | 'loading' | 'confirmed' | 'rejected';
  statusMessage?: string;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  side,
  name,
  rating,
  time,
  isWinner,
  isActive,
  lowTime,
  onOutcomeClick,
  status = 'idle',
  statusMessage
}) => {
  const handleClick = () => {
    if (onOutcomeClick) onOutcomeClick();
  };
  
  const isInteractive = !!onOutcomeClick;

  const betLabel = `Bet on ${side === 'white' ? 'White' : 'Black'}`;

  return (
    <div 
      className={`player-header player-header--${side} ${isActive ? 'player-header--active' : ''} player-header--${status} ${isInteractive ? 'player-header--interactive' : ''}`}
      data-bet-label={betLabel}
      onClick={isInteractive ? handleClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      aria-label={isInteractive ? `Bet on ${side} win` : undefined}
    >
      <div className="player-header__content">
        <div className="player-header__avatar">
          {side === 'white' ? '♔' : '♚'}
        </div>
        <div className="player-header__info">
          <div className="player-header__name">
            {name}
            {isWinner && <span className="player-header__winner-tag">WINNER</span>}
          </div>
          <div className="player-header__rating">{rating}</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className={`player-header__clock ${lowTime ? 'player-header__clock--low' : ''}`}>
          {time}
        </div>
        {isInteractive && (
          <button type="button" className="player-header__bet-btn" onClick={(e) => { e.stopPropagation(); handleClick(); }} aria-label={betLabel}>
            {betLabel}
          </button>
        )}
      </div>

      {statusMessage && status === 'rejected' && (
        <div className="player-header__message">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default PlayerHeader;
