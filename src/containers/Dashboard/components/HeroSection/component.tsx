import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DashboardStats } from 'hooks/useDashboardData';
import { getBalanceHistory } from 'store/actionCreators/authActionCreators';
import { RootState } from 'store/reducers';
import './style.scss';

// Enhanced line chart component with animations
const EnhancedChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (data.length < 2) return null;

  const balances = data.map(d => d.balance);
  const min = Math.min(...balances) * 0.95; // Add 5% padding at bottom
  const max = Math.max(...balances) * 1.05; // Add 5% padding at top
  const range = max - min || 1;

  // Create points string for polyline
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    // Move the entire chart up even more - use top 40% of the height
    const y = 40 - ((item.balance - min) / range) * 30;
    return `${x},${y}`;
  }).join(' ');

  // Create area fill points (for gradient area under the line)
  const areaPoints = points + ` 100,40 0,40`; // Close the path at the bottom

  // Determine if trend is positive
  const isPositive = data[data.length-1].balance >= data[0].balance;
  const lineColor = isPositive ? "#00EFB2" : "#FF4757"; // Use token colors from design system
  const gradientStart = isPositive ? "rgba(0, 239, 178, 0.2)" : "rgba(255, 71, 87, 0.2)";
  const gradientEnd = "rgba(0, 0, 0, 0)";

  // Format the latest balance for display
  const latestBalance = data[data.length - 1].balance.toFixed(0);
  const change = (data[data.length - 1].balance - data[0].balance).toFixed(1);
  const changePercent = ((data[data.length - 1].balance - data[0].balance) / data[0].balance * 100).toFixed(1);

  return (
    <div className="enhanced-chart">
      <div className="chart-header">
        <div className="chart-title">Balance History</div>
        <div className="chart-info">
          <div className="chart-value">{latestBalance}<span className="chart-token">tokens</span></div>
          <div className={`chart-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '↑' : '↓'}{Math.abs(Number(change))}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Gradient fill definition */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>

          {/* Gridlines (subtle) */}
          <line x1="0" y1="10" x2="100" y2="10" className="grid-line" />
          <line x1="0" y1="25" x2="100" y2="25" className="grid-line" />
          <line x1="0" y1="40" x2="100" y2="40" className="grid-line" />

          {/* Area fill under the line */}
          <polygon
            points={areaPoints}
            fill="url(#areaGradient)"
            className="chart-area"
          />

          {/* The line itself */}
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="chart-line"
          />

          {/* End point */}
          <circle
            cx={100}
            cy={points.split(' ').pop()?.split(',')[1]}
            r="1.5"
            fill={lineColor}
            className="chart-endpoint"
          />
        </svg>
      </div>

    </div>
  );
};

export interface HeroSectionProps {
  userName?: string;
  stats: DashboardStats;
}

const HeroSection: React.FC<HeroSectionProps> = ({ userName = 'Player', stats }) => {
  const dispatch = useDispatch();
  const { balanceHistory, loadingBalanceHistory, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getBalanceHistory(14)); // Get last 14 days of balance history
    }
  }, [dispatch, isAuthenticated]);

  // Format data for the chart
  const chartData = balanceHistory
    .slice()
    .reverse()
    .map(item => ({
      date: new Date(item.created_at).toLocaleDateString(),
      balance: item.balance
    }));

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-greeting">
          <h1 className="hero-title">Welcome back, {userName}!</h1>
          <p className="hero-subtitle">Ready to place some winning bets?</p>
        </div>

        <div className="hero-chart">
          {loadingBalanceHistory ? (
            <div className="loading-chart">Loading balance history...</div>
          ) : chartData.length < 2 ? (
            <div className="empty-chart">Not enough balance history to display chart</div>
          ) : (
            <EnhancedChart data={chartData} />
          )}
        </div>
      </div>

      <div className="hero-actions">
        <Link to="/active-bets" className="btn btn-primary hero-btn">
          View Active Bets
        </Link>
        <Link to="/betting-history" className="btn btn-secondary hero-btn">
          Betting History
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
