import React from 'react';

type Status = 'ok' | 'warn' | 'crit' | 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'active' | 'inactive' | 'confirmed' | 'requested' | 'up' | 'down' | 'neutral' | string;

const map: Record<string, string> = {
  ok: 'status-badge ok', warn: 'status-badge warn', crit: 'status-badge crit',
  pending: 'status-badge warn', requested: 'status-badge warn',
  approved: 'status-badge ok', processing: 'status-badge warn', paid: 'status-badge ok',
  rejected: 'status-badge crit', failed: 'status-badge crit', confirmed: 'status-badge ok',
  active: 'status-badge ok', inactive: 'status-badge warn',
  up: 'status-badge up', down: 'status-badge down', neutral: 'status-badge neutral',
};

// Trend icons for arrows
export const TrendIcon: React.FC<{ trend: number, threshold?: number }> = ({ trend, threshold = 0 }) => {
  if (Math.abs(trend) <= threshold) return <span className="trend-icon neutral">→</span>;
  return trend > 0
    ? <span className="trend-icon up">↑</span>
    : <span className="trend-icon down">↓</span>;
};

// Delta badge for showing numeric changes
export const DeltaBadge: React.FC<{ value: number, prefix?: string }> = ({ value, prefix = '' }) => {
  const status = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={`delta-badge ${status}`}>
      <TrendIcon trend={value} />
      {prefix}{sign}{value.toLocaleString()}
    </span>
  );
};

const StatusBadge: React.FC<{ status: Status }>= ({ status }) => (
  <span className={map[status] || 'status-badge'}>{String(status)}</span>
);

export default StatusBadge;
