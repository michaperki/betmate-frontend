import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats } from 'hooks/useDashboardData';
import './style.scss';

export interface HeroSectionProps {
  userName?: string;
  stats: DashboardStats;
}

const HeroSection: React.FC<HeroSectionProps> = ({ userName = 'Player', stats }) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-greeting">
          <h1 className="hero-title">Welcome back, {userName}!</h1>
          <p className="hero-subtitle">Ready to place some winning bets?</p>
        </div>
        
        <div className="hero-balance">
          <div className="balance-card">
            <span className="balance-label">Your Balance</span>
            <span className="balance-amount">{Math.round(stats.currentBalance)} tokens</span>
          </div>
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