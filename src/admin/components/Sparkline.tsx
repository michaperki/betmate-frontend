import React from 'react';

const Sparkline: React.FC<{ values: number[]; stroke?: string; fill?: string; width?: number; height?: number }>= ({ values, stroke = '#10b981', fill = 'rgba(16,185,129,0.15)', width = 100, height = 28 }) => {
  if (!values || values.length === 0) return <span style={{ opacity: 0.6 }}>—</span>;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1 || 1);
  const pts = values.map((v, i) => ({ x: i * step, y: height - (v / max) * (height - 2) - 1 }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} className="sparkline" aria-hidden>
      <path d={area} fill={fill} stroke="none" />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
};

export default Sparkline;

