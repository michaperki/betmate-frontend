import React from 'react';
import { connect } from 'react-redux';
import TournamentLobby from 'components/TournamentLobby';
import { fetchAllTournaments } from 'store/actionCreators/tournamentActionCreators';
import { AppState } from 'store/reducers';
import NavBar from 'components/NavBar/index';
import './style.scss';

interface TournamentLobbyContainerProps {
  tournaments: AppState['tournament']['tournaments'];
  loading: AppState['tournament']['loading']['tournaments'];
  error: AppState['tournament']['error']['tournaments'];
  fetchAllTournaments: () => void;
}

const TournamentLobbyContainer: React.FC<TournamentLobbyContainerProps> = ({
  tournaments,
  loading,
  error,
  fetchAllTournaments: fetchTournamentsAction,
}) => {
  return (
    <div className="tournament-lobby-container">
      <NavBar />
      <div className="tournament-lobby-content">
        <TournamentLobby
          tournaments={tournaments}
          loading={loading}
          error={error}
          fetchTournaments={fetchTournamentsAction}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state: AppState) => ({
  tournaments: state.tournament.tournaments,
  loading: state.tournament.loading.tournaments,
  error: state.tournament.error.tournaments,
});

export default connect(
  mapStateToProps,
  { fetchAllTournaments },
)(TournamentLobbyContainer);
