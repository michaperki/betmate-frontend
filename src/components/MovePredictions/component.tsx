import React, { useEffect, useRef, useState } from 'react';
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
  // Long‑press (hold to confirm) — enabled for touch/pen pointers
  const [holdingIndex, setHoldingIndex] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const holdStartRef = useRef<number>(0);
  const holdRafRef = useRef<number | null>(null);

  const cancelHold = () => {
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    holdRafRef.current = null;
    setHoldingIndex(null);
    setHoldProgress(0);
  };

  useEffect(() => () => cancelHold(), []);

  const startHold = (index: number, move: string) => {
    holdStartRef.current = performance.now();
    setHoldingIndex(index);
    const duration = 800; // ms per mock
    const step = (now: number) => {
      const p = Math.min(1, (now - holdStartRef.current) / duration);
      setHoldProgress(p);
      if (p < 1) {
        holdRafRef.current = requestAnimationFrame(step);
      } else {
        // Confirmed by hold
        cancelHold();
        if (!gameEnded && onMoveClick) onMoveClick(move, index);
      }
    };
    holdRafRef.current = requestAnimationFrame(step);
  };

  const onItemPointerDown = (e: React.PointerEvent, index: number, move: string) => {
    if (gameEnded || !onMoveClick) return;
    // Only require hold on touch/pen; mouse can click as usual
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
      startHold(index, move);
    }
  };
  const onItemPointerUp = (e: React.PointerEvent) => { cancelHold(); };
  const onItemPointerCancel = (e: React.PointerEvent) => { cancelHold(); };
  const onItemPointerLeave = (e: React.PointerEvent) => { cancelHold(); };

  return (
    <div className="move-predictions">
      <div className="move-predictions__header">Move Predictions</div>
      <div className="move-predictions__list">
        {loading && moves.length === 0 && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} aria-busy className="move-predictions__item move-predictions__item--disabled" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: 14, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 7, marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ height: 12, width: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                  <div style={{ height: 12, width: 48, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)', animation: 'shimmer 1.8s infinite' }} />
              </div>
            ))}
          </>
        )}
        {!loading && moves.length === 0 && (
          <div className="move-predictions__empty" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            fontSize: 12,
            opacity: 0.7
          }}>No move predictions available.</div>
        )}
        {moves.map((move, index) => (
          <div 
            key={`${move.move}-${index}`}
            className={`move-predictions__item ${gameEnded ? 'move-predictions__item--ended' : ''} ${move.status ? `move-predictions__item--${move.status}` : ''}`}
            onClick={() => { if (!gameEnded && move.status !== 'disabled' && onMoveClick) onMoveClick(move.move, index); }}
            onPointerDown={(e) => onItemPointerDown(e, index, move.move)}
            onPointerUp={onItemPointerUp}
            onPointerCancel={onItemPointerCancel}
            onPointerLeave={onItemPointerLeave}
            onMouseEnter={() => onMoveHover && onMoveHover(move.move, index)}
            onMouseLeave={() => onMoveHoverEnd && onMoveHoverEnd()}
            role={onMoveClick ? "button" : undefined}
            tabIndex={onMoveClick ? 0 : undefined}
            onKeyDown={(e) => { 
              if (!gameEnded && move.status !== 'disabled' && onMoveClick && (e.key === 'Enter' || e.key === ' ')) {
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
            {(holdingIndex === index) && (
              <div className="move-predictions__hold" aria-hidden>
                <div className="move-predictions__hold-ring" style={{
                  background: `conic-gradient(#22c55e ${Math.round(holdProgress * 360)}deg, rgba(255,255,255,0.08) 0deg)`
                }} />
                <div className="move-predictions__hold-inner" />
              </div>
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
