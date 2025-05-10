import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import TournamentGameViewer from 'components/TournamentGameViewer';
import { AppState } from 'store/reducers';
import { fetchGame, clearGame } from 'store/actionCreators/tournamentActionCreators';
import { getTournamentGameStreamUrl } from 'store/requests/tournamentRequests';
import { TournamentGame } from 'types/tournament';
import './style.scss';

interface TournamentGameViewerContainerProps {
  game: TournamentGame | null;
  loading: boolean;
  error: string | null;
  fetchGame: (tournamentId: string, roundId: string, gameId: string) => void;
  clearGame: () => void;
}

/**
 * Container component for the TournamentGameViewer
 * Handles data fetching and routing
 */
const TournamentGameViewerContainer: React.FC<TournamentGameViewerContainerProps> = ({
  game,
  loading,
  error,
  fetchGame: fetchGameAction,
  clearGame: clearGameAction,
}) => {
  const { tournamentId, roundId, gameId } = useParams<{
    tournamentId: string;
    roundId: string;
    gameId: string;
  }>();
  const history = useHistory();

  // Fetch game data when the component mounts
  useEffect(() => {
    if (tournamentId && roundId && gameId) {
      console.log('DEBUG - TournamentGameViewer: Fetching tournament game with:', {
        tournamentId,
        roundId,
        gameId,
      });
      fetchGameAction(tournamentId, roundId, gameId);
    }

    // Clear game data when the component unmounts
    return () => {
      clearGameAction();
    };
  }, [tournamentId, roundId, gameId, fetchGameAction, clearGameAction]);

  // Handle navigation back to the tournament detail page
  const handleBack = () => {
    history.push(`/tournaments/${tournamentId}`);
  };

  // Get game-specific stream URL for live games
  const streamUrl = tournamentId && roundId && gameId && game?.status === 'started'
    ? getTournamentGameStreamUrl(tournamentId, roundId, gameId)
    : undefined;

  if (streamUrl) {
    console.log('DEBUG - TournamentGameViewer: Using game stream URL:', streamUrl);
  }

  return (
    <div className="tournament-game-viewer-container">
      <TournamentGameViewer
        game={game}
        loading={loading}
        error={error}
        onBack={handleBack}
        streamUrl={streamUrl}
      />
    </div>
  );
};

const mapStateToProps = (state: AppState) => ({
  game: state.tournament.currentGame,
  loading: state.tournament.loading.game,
  error: state.tournament.error.game,
});

const mapDispatchToProps = {
  fetchGame,
  clearGame,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TournamentGameViewerContainer);
