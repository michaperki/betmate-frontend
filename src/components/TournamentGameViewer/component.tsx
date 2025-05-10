import React, { useEffect, useState } from 'react';
import { TournamentGame } from 'types/tournament';
import LoadingIcon from '../LoadingIcon';
import './style.scss';

// Import chess.js for move validation and pgn parsing
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chess = require('chess.js');

interface TournamentGameViewerProps {
  game: TournamentGame | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  streamUrl?: string;
}

/**
 * Component for viewing a tournament game with chessboard
 */
const TournamentGameViewer: React.FC<TournamentGameViewerProps> = ({
  game,
  loading,
  error,
  onBack,
  streamUrl,
}) => {
  const [, setChessInstance] = useState<any>(new Chess());
  const [fen, setFen] = useState<string>('start');
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Initialize the chess board when the game changes
  useEffect(() => {
    if (game && game.pgn) {
      const chessInstance = new Chess();
      try {
        chessInstance.load_pgn(game.pgn);
        setChessInstance(chessInstance);
        setFen(chessInstance.fen());

        // Extract moves from the pgn
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const moveHistory: any[] = [];
        const tempChess = new Chess();
        const historyMoves = chessInstance.history();
        for (let i = 0; i < historyMoves.length; i += 1) {
          tempChess.move(historyMoves[i]);
          moveHistory.push({
            san: historyMoves[i],
            fen: tempChess.fen(),
          });
        }

        setMoves(historyMoves);
        setCurrentMoveIndex(historyMoves.length - 1);
      } catch (e) {
        console.error('Error loading PGN:', e);
      }
    } else if (game) {
      // If we have a game but no PGN, set up the initial position
      const chessInstance = new Chess();
      if (game.fen) {
        try {
          chessInstance.load(game.fen);
        } catch (e) {
          console.error('Error loading FEN:', e);
        }
      }
      setChessInstance(chessInstance);
      setFen(chessInstance.fen());
      setMoves([]);
      setCurrentMoveIndex(-1);
    }
  }, [game]);

  // Set up event source for streaming moves
  useEffect(() => {
    if (streamUrl && game && !streaming) {
      try {
        const source = new EventSource(streamUrl);
        setEventSource(source);
        setStreaming(true);

        source.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'move' && data.data && data.data.fen) {
              // Update the board with the new move
              const chessInstance = new Chess();
              chessInstance.load(data.data.fen);
              setChessInstance(chessInstance);
              setFen(data.data.fen);

              // Add the move to history
              const history = chessInstance.history();
              setMoves(history);
              setCurrentMoveIndex(history.length - 1);
            } else if (data.type === 'end') {
              // Game has ended
              source.close();
              setStreaming(false);
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        };

        source.onerror = (sourceError) => {
          console.error('EventSource error:', sourceError);
          source.close();
          setStreaming(false);
        };

        return () => {
          source.close();
          setStreaming(false);
        };
      } catch (e) {
        console.error('Error setting up event source:', e);
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        setStreaming(false);
      }
    };
  }, [streamUrl, game, streaming]);

  // Navigate through move history
  const navigateToMove = (index: number) => {
    if (index >= -1 && index < moves.length) {
      const chessInstance = new Chess();

      if (index === -1) {
        // Initial position
        setFen(chessInstance.fen());
      } else {
        // Play moves up to the selected index
        for (let i = 0; i <= index; i += 1) {
          chessInstance.move(moves[i]);
        }
        setFen(chessInstance.fen());
      }

      setCurrentMoveIndex(index);
    }
  };

  // Render loading state
  if (loading && !game) {
    return (
      <div className="tournament-game-viewer loading-container">
        <LoadingIcon />
        <p>Loading game...</p>
      </div>
    );
  }

  // Render error state
  if (error && !game) {
    return (
      <div className="tournament-game-viewer error-container">
        <h2>Unable to load game</h2>
        <p>{error}</p>
        <button onClick={onBack} className="back-button">
          Back to Tournament
        </button>
      </div>
    );
  }

  // Render if game not found
  if (!game) {
    return (
      <div className="tournament-game-viewer not-found-container">
        <h2>Game not found</h2>
        <p>The game you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <button onClick={onBack} className="back-button">
          Back to Tournament
        </button>
      </div>
    );
  }

  return (
    <div className="tournament-game-viewer">
      <div className="game-header">
        <button onClick={onBack} className="back-button">
          &larr; Back to Tournament
        </button>
        <div className="game-info">
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
          <div className="game-status">
            {streaming ? (
              <span className="live-indicator">Live</span>
            ) : (
              <span className="status">{game.status}</span>
            )}
          </div>
        </div>
      </div>

      <div className="game-board-container">
        <div className="chessboard">
          {/*
            This is a placeholder for a chess board component.
            We would normally use a library like Chessground or react-chessboard here.
            For simplicity, we're just showing the FEN string.
          */}
          <div className="board-placeholder">
            <p>Board placeholder - FEN: {fen}</p>
            <p className="note">
              Note: In a real implementation, this would be replaced with a proper chessboard component
              like Chessground or react-chessboard.
            </p>
          </div>
        </div>

        <div className="move-history">
          <h3>Moves</h3>
          <div className="moves-list">
            <button
              className={currentMoveIndex === -1 ? 'active' : ''}
              onClick={() => navigateToMove(-1)}
            >
              Start
            </button>

            {moves.map((move, index) => (
              <button
                key={`${move}-${index}`}
                className={index === currentMoveIndex ? 'active' : ''}
                onClick={() => navigateToMove(index)}
              >
                {index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ''} {move}
              </button>
            ))}
          </div>

          <div className="navigation">
            <button
              onClick={() => navigateToMove(-1)}
              disabled={currentMoveIndex === -1}
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => navigateToMove(currentMoveIndex - 1)}
              disabled={currentMoveIndex <= -1}
            >
              &lt;
            </button>
            <button
              onClick={() => navigateToMove(currentMoveIndex + 1)}
              disabled={currentMoveIndex >= moves.length - 1}
            >
              &gt;
            </button>
            <button
              onClick={() => navigateToMove(moves.length - 1)}
              disabled={currentMoveIndex >= moves.length - 1}
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentGameViewer;
