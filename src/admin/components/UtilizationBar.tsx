import React from 'react';

interface UtilizationBarProps {
  used: number;
  cap: number;
  label: string;
  width?: string;
  height?: number;
  showValue?: boolean;
  prefix?: string;
  decimalPlaces?: number;
  showPercentage?: boolean;
  animate?: boolean;
}

const UtilizationBar: React.FC<UtilizationBarProps> = ({
  used,
  cap,
  label,
  width = '100%',
  height = 8,
  showValue = true,
  prefix = '$',
  decimalPlaces = 2,
  showPercentage = false,
  animate = true
}) => {
  const pct = Math.max(0, Math.min(1, cap > 0 ? used / cap : 0));
  
  const getBarColor = (percentage: number) => {
    if (percentage >= 0.9) return '#d9534f';
    if (percentage >= 0.7) return '#f0ad4e';
    return '#5cb85c';
  };
  
  const barColor = getBarColor(pct);
  
  const fmt = (x: number) => {
    if (x === 0) return '0';
    if (Math.abs(x) < 0.01) return '<0.01';
    return x.toFixed(decimalPlaces);
  };
  
  return (
    <div style={{ width }}>
      {showValue && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ fontWeight: pct >= 0.8 ? 600 : 400, color: pct >= 0.9 ? barColor : undefined }}>{label}</span>
          <span style={{ color: pct >= 0.9 ? barColor : undefined }}>
            {prefix}{fmt(used)} {showPercentage && <span style={{ opacity: 0.7 }}>({Math.round(pct * 100)}%)</span>} / {prefix}{fmt(cap)}
          </span>
        </div>
      )}
      <div style={{ height, background: '#2d3748', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div 
          style={{ 
            width: `${pct * 100}%`, 
            background: barColor, 
            height: '100%',
            borderRadius: 4,
            transition: animate ? 'width 0.6s ease-out' : 'none',
            position: 'relative'
          }} 
        />
        {cap > 0 && (
          <>
            <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 1, background: 'rgba(240,173,78,0.5)', zIndex: 1 }} />
            <div style={{ position: 'absolute', left: '90%', top: 0, bottom: 0, width: 1, background: 'rgba(217,83,79,0.5)', zIndex: 1 }} />
          </>
        )}
      </div>
    </div>
  );
};

export default UtilizationBar;

