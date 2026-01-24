import React, { useMemo, useState } from 'react';
import { useMode } from 'context/ModeContext';
import { realWdlMultiplier } from 'utils/realOdds';

type Outcome = 'white_win' | 'draw' | 'black_win';

export interface DrawOutcomeCardProps {
  disabled?: boolean;
  odds?: { white_win?: number; draw?: number; black_win?: number } | null;
  onPlace?: (outcome: Outcome, stake: number) => void;
  disabledReason?: string;
}

const DrawOutcomeCard: React.FC<DrawOutcomeCardProps> = ({ disabled, odds, onPlace, disabledReason }) => {
  const { mode, limits } = useMode();
  const [selected, setSelected] = useState<Outcome | null>(null);
  const [stake, setStake] = useState<number>(2);

  const multipliers = useMemo(() => {
    const pW = Number(odds?.white_win ?? 0);
    const pD = Number(odds?.draw ?? 0);
    const pB = Number(odds?.black_win ?? 0);
    const toX = (p: number, key: Outcome) => {
      if (!p || p <= 0) return 0;
      if (mode === 'real') return realWdlMultiplier(key, p, undefined);
      return 1 / p;
    };
    return {
      white: toX(pW, 'white_win'),
      draw: toX(pD, 'draw'),
      black: toX(pB, 'black_win'),
    };
  }, [odds, mode]);

  const chips = [2, 5, 10, 25];
  const canAct = !disabled && !!selected && stake >= 1;
  const currency = mode === 'real' ? 'USDT' : 'KBITZ';
  const minStake = 1;
  const maxStake = mode === 'arcade' ? (limits?.arcadeMaxStakeWdl ?? undefined) : undefined;
  const maxHint = typeof maxStake === 'number' ? `${maxStake} ${currency}` : (mode === 'real' ? undefined : undefined);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Game Outcome</span>
        <span style={{ opacity: 0.4, fontSize: 10, letterSpacing: '1px' }}>Click to select</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {/* White */}
        <button
          onClick={() => setSelected('white_win')}
          disabled={disabled}
          style={{
            background: selected === 'white_win' ? 'rgba(34,197,94,0.18)' : 'linear-gradient(135deg,#f5f5f5 0%, #d4d4d4 100%)',
            border: selected === 'white_win' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.16)',
            borderRadius: 10,
            padding: '14px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minHeight: 86,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a24', textAlign: 'center' }}>White Wins</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a24', marginTop: 'auto' }}>x{multipliers.white ? multipliers.white.toFixed(2) : '—'}</span>
          </div>
        </button>

        {/* Draw */}
        <button
          onClick={() => setSelected('draw')}
          disabled={disabled}
          style={{
            background: selected === 'draw' ? 'rgba(34,197,94,0.18)' : 'linear-gradient(135deg,#3b3b4f 0%, #2a2a3a 100%)',
            border: selected === 'draw' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.16)',
            borderRadius: 10,
            padding: '14px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minHeight: 86,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e8e8e8', textAlign: 'center' }}>Draw</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', marginTop: 'auto' }}>x{multipliers.draw ? multipliers.draw.toFixed(2) : '—'}</span>
          </div>
        </button>

        {/* Black */}
        <button
          onClick={() => setSelected('black_win')}
          disabled={disabled}
          style={{
            background: selected === 'black_win' ? 'rgba(34,197,94,0.18)' : 'linear-gradient(135deg,#2a2a3a 0%, #1a1a24 100%)',
            border: selected === 'black_win' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10,
            padding: '14px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minHeight: 86,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e8e8e8', textAlign: 'center' }}>Black Wins</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginTop: 'auto' }}>x{multipliers.black ? multipliers.black.toFixed(2) : '—'}</span>
          </div>
        </button>
      </div>

      {/* Quick stake + input */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {chips.map((c) => (
          <button key={c} onClick={() => setStake(c)} disabled={disabled} style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e8e8e8', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600
          }}>
            ${c}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>$</span>
          <input type="number" min={1} step={1} value={stake} onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 0))} disabled={disabled} style={{
            width: 80, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e8e8e8', fontFamily: 'inherit', fontSize: 12
          }} />
          <button onClick={() => selected && onPlace?.(selected, stake)} disabled={!canAct} style={{
            padding: '8px 12px', borderRadius: 8, border: 'none', background: canAct ? 'linear-gradient(135deg,#22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.15)', color: canAct ? '#000' : '#7f7f7f', fontWeight: 800, cursor: canAct ? 'pointer' : 'not-allowed', fontSize: 12
          }}>
            Place
          </button>
        </div>
      </div>

      {/* Hints and disabled copy */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, opacity: 0.6 }}>
          Min {minStake} {currency}{maxHint ? ` • Max ${maxHint}` : ''}
        </div>
        {disabled && (
          <div style={{ fontSize: 11, color: '#fbbf24' }}>
            {disabledReason || 'Betting unavailable'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawOutcomeCard;
