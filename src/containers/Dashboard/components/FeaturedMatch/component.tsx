import React from 'react';
import { useHistory } from 'react-router-dom';
import { Game } from 'types/resources/game';
import { WDLBar } from 'components/WagerPanel/helper_components';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import blackPawn from 'assets/dashboard/blackPawn.svg';
import whitePawn from 'assets/dashboard/whitePawn.svg';
import './style.scss';

export interface FeaturedMatchProps {
  game: Game;
}

const FeaturedMatch: React.FC<FeaturedMatchProps> = ({ game }) => {
  const history = useHistory();
  const { isMobile } = useResponsiveLayout();

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

      <div className="featured-game-content">
        {/* Use the same layout for both mobile and desktop to ensure consistent appearance */}
        <div className={isMobile ? "mobile-game-layout" : "desktop-game-layout"}>
          <div className="match-info">
            <div className="players-with-pawns">
              <img src={blackPawn} alt="Black Pawn" className="pawn-decoration pawn-left" />

              <div className="players-vertical">
                <div className="player">
                  <span className="player-name">{game.player_black.name}</span>
                  <span className="player-rating">({game.player_black.elo})</span>
                </div>
                <div className="vs-divider">VS</div>
                <div className="player">
                  <span className="player-name">{game.player_white.name}</span>
                  <span className="player-rating">({game.player_white.elo})</span>
                </div>
              </div>

              <img src={whitePawn} alt="White Pawn" className="pawn-decoration pawn-right" />
            </div>

            <div className="odds-bar">
              <WDLBar
                odds={game.odds}
                height={isMobile ? 20 : 30}
                width={isMobile ? 280 : 400}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="featured-actions">
        <button
          className="btn btn-primary featured-bet-btn"
          onClick={() => history.push(`/chess/${game._id}`)}
        >
          Join Game
        </button>
        <button className="btn btn-secondary featured-watch-btn">
          View Details
        </button>
      </div>
    </section>
  );
};

export default FeaturedMatch;