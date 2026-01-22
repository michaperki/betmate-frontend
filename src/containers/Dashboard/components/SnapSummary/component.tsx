import React from 'react';
import { DashboardStats } from 'hooks/useDashboardData';
import Card from 'components/Card/component';
import './style.scss';
import { useMode } from 'context/ModeContext';

interface SnapSummaryProps {
  userName?: string;
  stats: DashboardStats;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const SnapSummary: React.FC<SnapSummaryProps> = ({ userName = 'Player', stats }) => {
  const { mode } = useMode();
  return (
    <Card className="snap-summary">
      <div className="summary-left">
        <div className="user-id">
          <div className="avatar" aria-hidden />
          <div className="user-meta">
            <div className="label">Welcome</div>
            <div className="name">{userName}</div>
          </div>
        </div>
      </div>
      <div className="summary-metrics">
        <Card className="metric">
          <div className="metric-label">Balance</div>
          <div className="metric-value">{Math.round(stats.currentBalance)}</div>
          <div className="metric-suffix">{mode === 'real' ? 'USDT' : 'KBITZ'}</div>
        </Card>
        <Card className="metric">
          <div className="metric-label">Win rate</div>
          <div className="metric-value">{formatPercent(stats.winRate)}</div>
          <div className="metric-suffix placeholder" />
        </Card>
        <Card className="metric">
          <div className="metric-label">Total wagers</div>
          <div className="metric-value">{stats.totalWagers}</div>
          <div className="metric-suffix placeholder" />
        </Card>
        <Card className="metric">
          <div className="metric-label">Active matches</div>
          <div className="metric-value">{stats.activeMatches}</div>
          <div className="metric-suffix placeholder" />
        </Card>
      </div>
    </Card>
  );
};

export default SnapSummary;
