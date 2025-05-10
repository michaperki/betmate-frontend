import React, { useState } from 'react';
import {
  Tournament,
  TournamentRound,
  TournamentRoundDetail,
  TournamentGame,
} from 'types/tournament';
import LoadingIcon from '../LoadingIcon';
import './style.scss';

interface TournamentDetailProps {
  tournament: Tournament | null;
  currentRound: TournamentRoundDetail | null;
  loading: {
    tournament: boolean;
    round: boolean;
  };
  error: {
    tournament: string | null;
    round: string | null;
  };
  onRoundSelect: (roundId: string) => void;
  onGameSelect: (gameId: string) => void;
}

/**
 * Tournament detail component displaying tournament information, rounds, and games
 */
const TournamentDetail: React.FC<TournamentDetailProps> = ({
  tournament,
  currentRound,
  loading,
  error,
  onRoundSelect,
  onGameSelect,
}) => {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  // Handle round selection
  const handleRoundSelect = (roundId: string) => {
    setSelectedRoundId(roundId);
    onRoundSelect(roundId);
  };

  // Render loading state
  if (loading.tournament && !tournament) {
    return (
      <div className="tournament-detail loading-container">
        <LoadingIcon />
        <p>Loading tournament details...</p>
      </div>
    );
  }

  // Render error state
  if (error.tournament && !tournament) {
    return (
      <div className="tournament-detail error-container">
        <h2>Unable to load tournament</h2>
        <p>{error.tournament}</p>
      </div>
    );
  }

  // Render if tournament not found
  if (!tournament) {
    return (
      <div className="tournament-detail not-found-container">
        <h2>Tournament not found</h2>
        <p>The tournament you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="tournament-detail">
      {/* Tournament header */}
      <div className="tournament-header">
        <div className="tournament-info">
          <h1 className="tournament-name">{tournament.name}</h1>
          <div className={`tournament-status status-${tournament.status.toLowerCase()}`}>
            {tournament.status}
          </div>
        </div>

        {tournament.description && (
          <p className="tournament-description">{tournament.description}</p>
        )}

        {tournament.url && (
          <a
            href={tournament.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tournament-link"
          >
            Official Tournament Page
          </a>
        )}
      </div>

      {/* Tournament rounds */}
      <div className="tournament-rounds">
        <h2>Rounds</h2>
        <div className="rounds-list">
          {tournament.rounds.map((round: TournamentRound) => (
            <button
              key={round.id}
              className={`round-button ${round.status.toLowerCase()} ${
                selectedRoundId === round.id ? 'selected' : ''
              }`}
              onClick={() => handleRoundSelect(round.id)}
            >
              {round.name}
              <span className="round-status">{round.status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Games in the selected round */}
      <div className="tournament-games">
        <h2>Games</h2>

        {/* Loading state */}
        {loading.round && !currentRound && (
          <div className="games-loading">
            <LoadingIcon />
            <p>Loading games...</p>
          </div>
        )}

        {/* Error state */}
        {!loading.round && error.round && !currentRound && (
          <div className="games-error">
            <p>Error loading games: {error.round}</p>
          </div>
        )}

        {/* No round selected state */}
        {!loading.round && !error.round && !currentRound && (
          <div className="games-empty">
            <p>Select a round to view games</p>
          </div>
        )}

        {/* Empty games list state */}
        {!loading.round && !error.round && currentRound && currentRound.games.length === 0 && (
          <div className="games-empty">
            <p>No games available for this round</p>
          </div>
        )}

        {/* Games list */}
        {!loading.round && !error.round && currentRound && currentRound.games.length > 0 && (
          <div className="games-list">
            {currentRound.games.map((game: TournamentGame) => (
              <div
                key={game.id}
                className={`game-item ${game.status.toLowerCase()}`}
                onClick={() => onGameSelect(game.id)}
              >
                <div className="players">
                  <div className="player white">
                    <span className="player-name">{game.players.white.name}</span>
                    {game.players.white.title && (
                      <span className="player-title">{game.players.white.title}</span>
                    )}
                  </div>
                  <div className="vs">vs</div>
                  <div className="player black">
                    <span className="player-name">{game.players.black.name}</span>
                    {game.players.black.title && (
                      <span className="player-title">{game.players.black.title}</span>
                    )}
                  </div>
                </div>
                <div className="game-status">{game.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
