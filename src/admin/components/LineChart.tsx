import React from 'react';

type Series = { name: string; color: string; values: number[] };

// Minimal multi-series line chart with inline SVG.
const LineChart: React.FC<{ series: Series[]; width?: number; height?: number; yMax?: number }>= ({ series, width = 460, height = 120, yMax }) => {
  const all = series.flatMap(s => s.values);
  const max = Math.max(1, yMax ?? (all.length ? Math.max(...all) : 1));
  const steps = Math.max(1, (series[0]?.values.length || 1) - 1);
  const dx = width / (steps || 1);
  return (
    <svg width={width} height={height} role="img" aria-label="chart">
      <rect x={0} y={0} width={width} height={height} fill="#0b0b0b" />
      {series.map((s) => {
        const d = s.values.map((v, i) => {
          const x = i * dx;
          const y = height - (v / max) * (height - 8) - 4;
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        }).join(' ');
        return <path key={s.name} d={d} fill="none" stroke={s.color} strokeWidth={1.5} />;
      })}
    </svg>
  );
};

export default LineChart;

