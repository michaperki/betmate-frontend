import React from 'react';
import './style.scss';

// Export interface so it can be imported elsewhere
export interface MoveOption {
  move: string;
  score: number;
  odds: number;
  status?: 'idle' | 'loading' | 'won' | 'lost' | 'disabled';
  message?: string;
}

interface MovePredictionsProps {
  moves: MoveOption[];
  gameEnded?: boolean;
  onMoveClick?: (move: string, index: number) => void;
  onMoveHover?: (move: string, index: number) => void;
  onMoveHoverEnd?: () => void;
  loading?: boolean;
}

const MovePredictions: React.FC<MovePredictionsProps> = ({
  moves,
  gameEnded = false,
  onMoveClick,
  onMoveHover,
  onMoveHoverEnd,
  loading = false,
}) => {
  return (
    <div className="move-predictions">
      <div className="move-predictions__header">Move Predictions</div>
      <div className="move-predictions__list">
        {loading && moves.length === 0 && (
          <div className="move-predictions__empty">Loading…</div>
        )}
        {!loading && moves.length === 0 && (
          <div className="move-predictions__empty">No moves available</div>
        )}
        {moves.map((move, index) => (
          <div 
            key={`${move.move}-${index}`}
            className={`move-predictions__item ${gameEnded ? 'move-predictions__item--ended' : ''} ${move.status ? `move-predictions__item--${move.status}` : ''}`}
            onClick={() => onMoveClick && onMoveClick(move.move, index)}
            onMouseEnter={() => onMoveHover && onMoveHover(move.move, index)}
            onMouseLeave={() => onMoveHoverEnd && onMoveHoverEnd()}
            role={onMoveClick ? "button" : undefined}
            tabIndex={onMoveClick ? 0 : undefined}
            onKeyDown={(e) => { 
              if (onMoveClick && (e.key === 'Enter' || e.key === ' ')) {
                onMoveClick(move.move, index);
                e.preventDefault();
              }
            }}
          >
            <div className="move-predictions__move">{move.move}</div>
            <div className="move-predictions__details">
              <span className="move-predictions__score">{move.score}</span>
              <span className="move-predictions__odds">x{move.odds.toFixed(2)}</span>
            </div>
            {move.status === 'loading' && (
              <div className="move-predictions__loader"></div>
            )}
            {move.message && ['lost', 'disabled'].includes(move.status || '') && (
              <div className="move-predictions__message">{move.message}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovePredictions;
