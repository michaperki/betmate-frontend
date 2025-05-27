import React from 'react';
import { Game } from 'types/resources/game';
import GameCard from 'components/GameCard/component';
import './style.scss';

export interface FeaturedMatchProps {
  game: Game;
}

const FeaturedMatch: React.FC<FeaturedMatchProps> = ({ game }) => {
  return (
    <section className="featured-match">
      <div className="featured-header">
        <h2 className="featured-title">
          <span className="featured-icon">🔥</span>
          Featured Match
        </h2>
        <div className="featured-badge">
          <span className="badge-text">High Stakes</span>
        </div>
      </div>
      
      <div className="featured-game-container">
        <GameCard game={game} topGame />
      </div>

      <div className="featured-actions">
        <button className="btn btn-primary featured-bet-btn">
          Quick Bet
        </button>
        <button className="btn btn-secondary featured-watch-btn">
          Watch Live
        </button>
      </div>
    </section>
  );
};

export default FeaturedMatch;