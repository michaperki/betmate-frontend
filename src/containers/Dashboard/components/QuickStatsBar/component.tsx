import React from 'react';
import { DashboardStats } from 'hooks/useDashboardData';
import './style.scss';
import { useMode } from 'context/ModeContext';

export interface QuickStatsBarProps {
  stats: DashboardStats;
}

const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ stats }) => {
  const { mode } = useMode();
  const statsData = [
    {
      label: 'Total Wagers',
      value: stats.totalWagers,
      suffix: '',
      color: 'blue',
    },
    {
      label: 'Win Rate',
      value: stats.winRate,
      suffix: '%',
      color: 'green',
    },
    {
      label: 'Balance',
      value: Math.round(stats.currentBalance),
      suffix: ` ${mode === 'real' ? 'USDT' : 'KBITZ'}`,
      color: 'yellow',
    },
    {
      label: 'Active Matches',
      value: stats.activeMatches,
      suffix: '',
      color: 'purple',
    },
  ];

  return (
    <div className="quick-stats-bar">
      <div className="stats-container">
        {statsData.map((stat, index) => (
          <div key={stat.label} className={`stat-card stat-card--${stat.color}`}>
            <div className="stat-icon">
              {stat.color === 'blue' && <span>🎮</span>}
              {stat.color === 'green' && <span>🏆</span>}
              {stat.color === 'yellow' && <span>💰</span>}
              {stat.color === 'purple' && <span>♟️</span>}
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {stat.value}{stat.suffix}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStatsBar;
