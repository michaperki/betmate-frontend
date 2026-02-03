import React from 'react';
import Sparkline from './Sparkline';
import { DeltaBadge, TrendIcon } from './StatusBadge';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  trend?: number;
  delta?: number;
  sparkValues?: number[];
  sparkColor?: string;
  sparkFill?: string;
  progress?: number;
  progressColor?: string;
  badge?: string;
  prefix?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon = "$",
  iconColor = "#34d399",
  iconBg = "rgba(16,185,129,0.12)",
  trend,
  delta,
  sparkValues,
  sparkColor = "#10b981",
  sparkFill = "rgba(16,185,129,0.15)",
  progress,
  progressColor,
  badge,
  prefix = ""
}) => {
  const trendStatus = trend === undefined ? undefined : trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.85), rgba(2,6,23,0.85))', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ padding: 10, borderRadius: 10, background: iconBg, color: iconColor }}>{icon}</div>
        {badge && (<span style={{ fontSize: 12, color: iconColor, fontWeight: 600 }}>{badge}</span>)}
        {delta !== undefined && (<DeltaBadge value={delta} prefix={prefix} />)}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}>{subtitle}</div>
        {trend !== undefined && <TrendIcon trend={trend} />}
      </div>
      {sparkValues && sparkValues.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline values={sparkValues} stroke={sparkColor} fill={sparkFill} width={180} />
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden" style={{ marginTop: 12 }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: progressColor || 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)' }} />
        </div>
      )}
    </div>
  );
};

export default KPICard;

