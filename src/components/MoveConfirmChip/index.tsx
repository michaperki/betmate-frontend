import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import StarRating from 'components/StarRating';

interface MoveConfirmChipProps {
  parentRef: React.RefObject<HTMLElement>;
  destSquare: string; // algebraic like 'e4'
  score?: number | null; // percentile or score number
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Convert algebraic square to 0-based file/rank indices with top-left origin (a8 -> 0,0)
function squareToGrid(dest: string): { x: number; y: number } | null {
  if (!dest || dest.length < 2) return null;
  const file = dest[0].toLowerCase();
  const rank = Number(dest[1]);
  const files = 'abcdefgh';
  const fx = files.indexOf(file);
  if (fx < 0 || !Number.isFinite(rank)) return null;
  const x = fx;
  const y = 8 - rank; // rank 8 is top row
  if (x < 0 || x > 7 || y < 0 || y > 7) return null;
  return { x, y };
}

const MoveConfirmChip: React.FC<MoveConfirmChipProps> = ({
  parentRef, destSquare, score, loading, onConfirm, onCancel,
}) => {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const meRef = useRef<HTMLDivElement | null>(null);

  const grid = useMemo(() => squareToGrid(destSquare), [destSquare]);

  useEffect(() => {
    const el = parentRef.current as HTMLElement | null;
    if (!el || !grid) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const square = size / 8;
      const cx = rect.left + (grid.x + 0.5) * square;
      const cy = rect.top + (grid.y + 0.5) * square;
      setPos({ left: cx, top: cy });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [parentRef, grid]);

  if (!pos) return null;

  // Position near the destination square, slightly above
  const style: React.CSSProperties = {
    position: 'fixed',
    left: pos.left,
    top: pos.top,
    transform: 'translate(-50%, -120%)',
    zIndex: 10,
    pointerEvents: 'auto',
  };

  // Subtle spinner for loading state
  const Spinner = () => (
    <span
      aria-label="Loading"
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: '2px solid var(--border-primary, rgba(255,255,255,0.2))',
        borderTopColor: 'var(--text-secondary, rgba(255,255,255,0.6))',
        display: 'inline-block',
        animation: 'mmc-spin 0.8s linear infinite',
      }}
    />
  );

  return (
    <div ref={meRef} style={style}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--card-bg, rgba(20,20,24,0.9))',
        color: 'var(--text-primary, #e8e8e8)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
        borderRadius: 10,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily: 'inherit',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
      }}>
        {loading ? <Spinner /> : null}
        <span style={{ opacity: 0.9, minWidth: 70, textAlign: 'center' }}>
          {loading ? (
            'Scoring…'
          ) : typeof score === 'number' ? (
            <StarRating score={score} maxStars={4} size="small" style={{ marginTop: 2 }} />
          ) : (
            'Score —'
          )}
        </span>
        <button
          onClick={onConfirm}
          style={{
            background: 'var(--success, #22c55e)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 12,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          aria-label="Cancel"
          style={{
            background: 'transparent',
            color: 'var(--text-secondary, #bdbdbd)',
            border: '1px solid var(--border-primary, rgba(255,255,255,0.2))',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 12,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
      {/* Inline keyframes for spinner */}
      <style>{'@keyframes mmc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
    </div>
  );
};

export default MoveConfirmChip;
