import React from 'react';
import { Game } from 'types/resources/game';
import GameCard from 'components/GameCard/component';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import './style.scss';

export interface LiveMatchesGridProps {
  games: Game[];
  isLoading?: boolean;
}

const LiveMatchesGrid: React.FC<LiveMatchesGridProps> = ({ games, isLoading = false }) => {
  const { isMobile, isTablet } = useResponsiveLayout();

  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  const getCardColorClass = (index: number) => {
    const colors = ['blue', 'pink', 'orange', 'purple'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <section className="live-matches-grid">
        <div className="matches-header">
          <h2 className="matches-title">Live Matches 🔎</h2>
        </div>
        <div className="loading-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="loading-card">
              <div className="loading-shimmer"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) {
    return (
      <section className="live-matches-grid">
        <div className="matches-header">
          <h2 className="matches-title">Live Matches 🔎</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3 className="empty-title">No matches available</h3>
          <p className="empty-description">
            Check back soon for new matches to bet on!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="live-matches-grid">
      <div className="matches-header">
        <h2 className="matches-title">Live Matches 🔎</h2>
        <span className="matches-count">{games.length} active</span>
      </div>
      
      <div className="matches-grid" style={{ gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)` }}>
        {games.map((game, index) => (
          <div key={game._id} className={`match-card-wrapper match-card--${getCardColorClass(index)}`}>
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default LiveMatchesGrid;