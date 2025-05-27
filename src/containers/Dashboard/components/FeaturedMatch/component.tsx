import React from 'react';
import { useHistory } from 'react-router-dom';
import { Game } from 'types/resources/game';
import { WDLBar } from 'components/WagerPanel/helper_components';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
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
        {isMobile ? (
          // Mobile-optimized vertical layout
          <div className="mobile-game-layout">
            <div className="match-info">
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

              <div className="odds-bar">
                <WDLBar
                  odds={game.odds}
                  height={20}
                  width={280}
                />
              </div>
            </div>
          </div>
        ) : (
          // Desktop layout - use original GameCard
          <div className="desktop-game-layout">
            <div className="game-card-wrapper">
              <div className='game-card'>
                <div className='game-title'>
                  <div className="player-side">
                    <div className="player-info">
                      <p className='player-name'>{game.player_black.name}</p>
                      <p className='player-rating'>({game.player_black.elo})</p>
                    </div>
                  </div>
                  <div className="vs-section">
                    <p className='vs-text'>VS</p>
                  </div>
                  <div className="player-side">
                    <div className="player-info">
                      <p className='player-name'>{game.player_white.name}</p>
                      <p className='player-rating'>({game.player_white.elo})</p>
                    </div>
                  </div>
                </div>
                <div className='wdl-bar'>
                  <WDLBar
                    odds={game.odds}
                    height={25}
                    width={400}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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