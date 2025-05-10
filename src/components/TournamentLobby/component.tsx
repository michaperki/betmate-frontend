import React, { useEffect, useState } from 'react';
import { Tournament } from 'types/tournament';
import TournamentCard from '../TournamentCard';
import LoadingIcon from '../LoadingIcon';
import './style.scss';

interface TournamentLobbyProps {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  fetchTournaments: () => void;
}

/**
 * Component for displaying a list of available tournaments
 */
const TournamentLobby: React.FC<TournamentLobbyProps> = ({
  tournaments,
  loading,
  error,
  fetchTournaments,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter tournaments based on the selected status
  const filteredTournaments = tournaments.filter((tournament) => {
    if (filterStatus === 'all') return true;
    return tournament.status === filterStatus;
  });

  // Get featured tournament (prioritize ongoing tournaments)
  const getFeaturedTournament = () => {
    const ongoingTournaments = tournaments.filter((t) => t.status === 'Ongoing');
    if (ongoingTournaments.length > 0) {
      return ongoingTournaments[0];
    }

    const upcomingTournaments = tournaments.filter((t) => t.status === 'Upcoming');
    if (upcomingTournaments.length > 0) {
      return upcomingTournaments[0];
    }

    return tournaments.length > 0 ? tournaments[0] : null;
  };

  const featuredTournament = getFeaturedTournament();

  // Fetch tournaments on component mount
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Render loading state
  if (loading && tournaments.length === 0) {
    return (
      <div className="tournament-lobby loading-container">
        <LoadingIcon />
        <p>Loading tournaments...</p>
      </div>
    );
  }

  // Render error state
  if (error && tournaments.length === 0) {
    return (
      <div className="tournament-lobby error-container">
        <h2>Unable to load tournaments</h2>
        <p>{error}</p>
        <button onClick={fetchTournaments}>Try Again</button>
      </div>
    );
  }

  // Render empty state
  if (!loading && tournaments.length === 0) {
    return (
      <div className="tournament-lobby empty-container">
        <h2>No tournaments available</h2>
        <p>There are currently no active tournaments. Please check back later.</p>
        <button onClick={fetchTournaments}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="tournament-lobby">
      <div className="tournament-lobby-header">
        <h1>Chess Tournaments</h1>
        <div className="tournament-filters">
          <button
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={filterStatus === 'Ongoing' ? 'active' : ''}
            onClick={() => setFilterStatus('Ongoing')}
          >
            Live
          </button>
          <button
            className={filterStatus === 'Upcoming' ? 'active' : ''}
            onClick={() => setFilterStatus('Upcoming')}
          >
            Upcoming
          </button>
          <button
            className={filterStatus === 'Finished' ? 'active' : ''}
            onClick={() => setFilterStatus('Finished')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Featured tournament section */}
      {featuredTournament && (
        <div className="featured-tournament-section">
          <h2>Featured Tournament</h2>
          <TournamentCard tournament={featuredTournament} featured={true} />
        </div>
      )}

      {/* All tournaments section */}
      <div className="tournaments-section">
        <h2>All Tournaments</h2>
        {loading && <p className="loading-message">Refreshing tournaments...</p>}

        {filteredTournaments.length === 0 ? (
          <p className="no-results">No tournaments match the selected filter.</p>
        ) : (
          <div className="tournaments-grid">
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                featured={false}
              />
            ))}
          </div>
        )}
      </div>

      <button className="refresh-button" onClick={fetchTournaments}>
        Refresh Tournaments
      </button>
    </div>
  );
};

export default TournamentLobby;
