import React from 'react';
import { Link } from 'react-router-dom';
import './style.scss';

interface QuickActionBarProps {
  featuredGameId?: string;
}

const QuickActionBar: React.FC<QuickActionBarProps> = ({ featuredGameId }) => {
  const joinHref = featuredGameId ? `/chess/${featuredGameId}` : undefined;
  return (
    <nav className="quick-action-bar" aria-label="Quick actions">
      <Link
        to={joinHref || '#'}
        className={`btn btn-primary qa-btn ${!joinHref ? 'disabled' : ''}`}
        aria-disabled={!joinHref}
        onClick={(e) => { if (!joinHref) e.preventDefault(); }}
      >
        Join Featured Match
      </Link>
      <Link to="/active-bets" className="btn btn-secondary qa-btn">
        View Active Bets
      </Link>
      <Link to="/betting-history" className="btn btn-secondary qa-btn">
        Betting History
      </Link>
    </nav>
  );
};

export default QuickActionBar;

