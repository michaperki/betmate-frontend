import React from 'react';
import { useHistory } from 'react-router-dom';
import { Tournament } from 'types/tournament';
import './style.scss';

interface TournamentCardProps {
  tournament: Tournament;
  featured?: boolean;
}

/**
 * Component for displaying a tournament card in the tournament list
 */
const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, featured = false }) => {
  const history = useHistory();

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Ongoing': return 'status-ongoing';
      case 'Upcoming': return 'status-upcoming';
      case 'Finished': return 'status-finished';
      default: return '';
    }
  };

  // Count rounds by status
  const ongoingRounds = tournament.rounds.filter((round) => round.status === 'Ongoing').length;
  const upcomingRounds = tournament.rounds.filter((round) => round.status === 'Upcoming').length;
  const finishedRounds = tournament.rounds.filter((round) => round.status === 'Finished').length;

  return (
    <div className={`tournament-card ${featured ? 'featured' : ''}`}>
      <div className="tournament-header">
        <h3 className="tournament-title">{tournament.name}</h3>
        <div className={`tournament-status ${getStatusClass(tournament.status)}`}>
          {tournament.status}
        </div>
      </div>

      {tournament.description && (
        <p className="tournament-description">{tournament.description}</p>
      )}

      <div className="tournament-rounds-summary">
        <div className="rounds-count">
          <span className="total-rounds">Rounds: {tournament.rounds.length}</span>
          {ongoingRounds > 0 && (
            <span className="ongoing-rounds">Live: {ongoingRounds}</span>
          )}
        </div>

        <div className="rounds-status">
          {finishedRounds > 0 && (
            <span className="finished-rounds">Completed: {finishedRounds}</span>
          )}
          {upcomingRounds > 0 && (
            <span className="upcoming-rounds">Upcoming: {upcomingRounds}</span>
          )}
        </div>
      </div>

      <button
        className="view-tournament-button"
        onClick={() => history.push(`/tournaments/${tournament.id}`)}
      >
        View Tournament
      </button>
    </div>
  );
};

export default TournamentCard;
