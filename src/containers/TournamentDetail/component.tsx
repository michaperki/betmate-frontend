import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import {
  fetchTournament,
  fetchRound,
  clearTournament,
} from 'store/actionCreators/tournamentActionCreators';
import TournamentDetail from 'components/TournamentDetail';
import NavBar from 'components/NavBar/index';
import { AppState } from 'store/reducers';
import './style.scss';

interface TournamentDetailContainerProps {
  tournament: AppState['tournament']['currentTournament'];
  currentRound: AppState['tournament']['currentRound'];
  loading: {
    tournament: AppState['tournament']['loading']['tournament'];
    round: AppState['tournament']['loading']['round'];
  };
  error: {
    tournament: AppState['tournament']['error']['tournament'];
    round: AppState['tournament']['error']['round'];
  };
  fetchTournament: (id: string) => void;
  fetchRound: (tournamentId: string, roundId: string) => void;
  clearTournament: () => void;
}

interface TournamentParams {
  tournamentId: string;
}

const TournamentDetailContainer: React.FC<TournamentDetailContainerProps> = ({
  tournament,
  currentRound,
  loading,
  error,
  fetchTournament: fetchTournamentAction,
  fetchRound: fetchRoundAction,
  clearTournament: clearTournamentAction,
}) => {
  const { tournamentId } = useParams<TournamentParams>();
  const history = useHistory();

  // Fetch tournament data on component mount
  useEffect(() => {
    fetchTournamentAction(tournamentId);

    // Clean up on unmount
    return () => {
      clearTournamentAction();
    };
  }, [tournamentId, fetchTournamentAction, clearTournamentAction]);

  // Handle round selection
  const handleRoundSelect = (roundId: string) => {
    fetchRoundAction(tournamentId, roundId);
  };

  // Handle game selection
  const handleGameSelect = (gameId: string) => {
    if (currentRound) {
      history.push(`/tournaments/${tournamentId}/rounds/${currentRound.id}/games/${gameId}`);
    }
  };

  return (
    <div className="tournament-detail-container">
      <NavBar />
      <div className="tournament-detail-content">
        <div className="back-navigation">
          <button onClick={() => history.push('/tournaments')}>
            &larr; Back to Tournaments
          </button>
        </div>
        <TournamentDetail
          tournament={tournament}
          currentRound={currentRound}
          loading={{
            tournament: loading.tournament,
            round: loading.round,
          }}
          error={{
            tournament: error.tournament,
            round: error.round,
          }}
          onRoundSelect={handleRoundSelect}
          onGameSelect={handleGameSelect}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state: AppState) => ({
  tournament: state.tournament.currentTournament,
  currentRound: state.tournament.currentRound,
  loading: {
    tournament: state.tournament.loading.tournament,
    round: state.tournament.loading.round,
  },
  error: {
    tournament: state.tournament.error.tournament,
    round: state.tournament.error.round,
  },
});

export default connect(
  mapStateToProps,
  {
    fetchTournament,
    fetchRound,
    clearTournament,
  },
)(TournamentDetailContainer);
