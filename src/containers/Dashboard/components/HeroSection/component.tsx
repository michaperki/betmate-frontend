import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DashboardStats } from 'hooks/useDashboardData';
import { getBalanceHistory } from 'store/actionCreators/authActionCreators';
import { RootState } from 'store/reducers';
import './style.scss';

// Manually implement recharts-like components
const LineChart: React.FC<{ children: React.ReactNode, data: any[], height: number, width: string }> = ({
  children, data, height, width
}) => {
  return (
    <div className="recharts-line-chart" style={{ height, width }}>
      {children}
      <svg width="100%" height="100%">
        {/* Simple SVG line chart implementation */}
        {data.length > 1 && (
          <BalanceLineChart data={data} height={height} />
        )}
      </svg>
    </div>
  );
};

// Helper component to draw the line
const BalanceLineChart: React.FC<{ data: any[], height: number }> = ({ data, height }) => {
  if (data.length < 2) return null;

  // Find min and max values for scaling
  const balances = data.map(d => d.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const range = maxBalance - minBalance || 1; // Avoid division by zero

  // Create points for the polyline
  const points = data.map((d, i) => {
    // Scale X based on position in array
    const x = (i / (data.length - 1)) * 100;

    // Scale Y (inverted, since SVG Y grows downward)
    // Padding of 20% at top and bottom
    const padding = 0.2;
    const yScale = (height * (1 - padding * 2));
    const y = height - (((d.balance - minBalance) / range) * yScale + (height * padding));

    return `${x}%,${y}`;
  }).join(' ');

  return (
    <>
      {/* Draw baseline */}
      <line
        x1="0%"
        y1={height - 10}
        x2="100%"
        y2={height - 10}
        stroke="#e0e0e0"
        strokeWidth="1"
      />

      {/* Draw the line */}
      <polyline
        points={points}
        fill="none"
        stroke="#8884d8"
        strokeWidth="2"
      />

      {/* Draw dots at data points */}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = height - (((d.balance - minBalance) / range) * (height * (1 - 0.4)) + (height * 0.2));
        return (
          <circle
            key={i}
            cx={`${x}%`}
            cy={y}
            r="3"
            fill="#8884d8"
          />
        );
      })}
    </>
  );
};

export interface HeroSectionProps {
  userName?: string;
  stats: DashboardStats;
}

const HeroSection: React.FC<HeroSectionProps> = ({ userName = 'Player', stats }) => {
  const dispatch = useDispatch();
  const { balanceHistory, loadingBalanceHistory } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(getBalanceHistory(14)); // Get last 14 days of balance history
  }, [dispatch]);

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
            <LineChart data={chartData} height={180} width="100%">
              {/* Chart renders internally */}
            </LineChart>
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