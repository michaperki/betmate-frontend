import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import Chessground from '@react-chess/chessground';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import { Key } from 'chessground/types';
import { GameStatus } from 'types/resources/game';
import { TournamentGame } from 'types/tournament';
import PlayerInfo from 'containers/ChessMatch/playerInfo/component';
import playerIconBlack from 'assets/player_icon_black.svg';
import playerIconWhite from 'assets/player_icon_white.svg';
import LoadingIcon from '../LoadingIcon';
import './style.scss';

// Update TournamentGame interface to include moves property
interface ExtendedTournamentGame extends TournamentGame {
  moves?: string[];
  updated_at?: string;
}

interface TournamentGameViewerProps {
  game: ExtendedTournamentGame | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  streamUrl?: string;
}

/**
 * Component for viewing a tournament game with chessboard
 * Uses the same interface as the ChessMatch component for consistency
 */
const TournamentGameViewer: React.FC<TournamentGameViewerProps> = ({
  game,
  loading,
  error,
  onBack,
  streamUrl,
}) => {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [streaming, setStreaming] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [lastMove, setLastMove] = useState<Key[]>([]);
  const [autoShapes] = useState<DrawShape[]>([]);
  const [config] = useState<Config>({
    coordinates: true,
    viewOnly: true,
    orientation: 'white',
    disableContextMenu: true,
    highlight: {
      lastMove: true,
      check: true,
    },
    movable: {
      free: false,
      color: undefined,
      dests: new Map(),
      showDests: true,
    },
    drawable: {
      enabled: false,
      visible: true,
      defaultSnapToValidMove: true,
      autoShapes: [],
    },
  });

  // Initialize the chess board when the game changes
  useEffect(() => {
    if (game && game.pgn) {
      try {
        chess.reset();
        chess.load_pgn(game.pgn);
        setFen(chess.fen());

        // Extract moves and set last move
        const historyMoves = chess.history({ verbose: true });
        setMoves(chess.history());

        // Set the last move for highlighting
        if (historyMoves.length > 0) {
          const lastMoveInfo = historyMoves[historyMoves.length - 1];
          setLastMove([lastMoveInfo.from as Key, lastMoveInfo.to as Key]);
        }

        setCurrentMoveIndex(chess.history().length - 1);
      } catch (e) {
        console.error('Error loading PGN:', e);
      }
    } else if (game && game.fen) {
      try {
        chess.reset();
        chess.load(game.fen);

        // Extract moves if available
        if (game.moves && Array.isArray(game.moves)) {
          // Apply the moves
          game.moves.forEach((move) => {
            try {
              chess.move(move);
            } catch (moveError) {
              console.error('Error applying move:', move, moveError);
            }
          });

          // Set last move if any moves were applied
          const history = chess.history({ verbose: true });
          if (history.length > 0) {
            const lastMoveInfo = history[history.length - 1];
            setLastMove([lastMoveInfo.from as Key, lastMoveInfo.to as Key]);
          }
        }

        setFen(chess.fen());
        setMoves(chess.history());
        setCurrentMoveIndex(chess.history().length - 1);
      } catch (e) {
        console.error('Error loading FEN:', e);
      }
    }
  }, [game, chess]);

  // Set up event source for streaming moves
  useEffect(() => {
    if (streamUrl && game && !streaming) {
      try {
        console.log('Connecting to stream:', streamUrl);
        const source = new EventSource(streamUrl);
        setEventSource(source);
        setStreaming(true);

        source.onmessage = (event) => {
          try {
            console.log('Received stream data:', event.data);
            const data = JSON.parse(event.data);

            // Handle connection confirmation
            if (data.type === 'connected') {
              console.log('Stream connected successfully');
              return;
            }

            // Handle different types of game updates
            if (data.type === 'move' || data.type === 'update') {
              // Check if we have FEN data
              const fenString = data.data?.fen || data.fen;

              if (fenString) {
                console.log('Received FEN update:', fenString);

                // Update the board with the new position
                try {
                  chess.reset();
                  chess.load(fenString);
                  setFen(fenString);

                  // Determine the last move by comparing history
                  const history = chess.history({ verbose: true });
                  if (history.length > 0) {
                    const lastMoveInfo = history[history.length - 1];
                    setLastMove([lastMoveInfo.from as Key, lastMoveInfo.to as Key]);
                  }

                  // Update move list
                  setMoves(chess.history());
                  setCurrentMoveIndex(chess.history().length - 1);
                } catch (fenError) {
                  console.error('Error loading streamed FEN:', fenError);
                }
              }
            } else if (data.type === 'end') {
              // Game has ended
              console.log('Game stream ended');
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
          console.log('Closing stream connection');
          source.close();
          setStreaming(false);
        };
      } catch (e) {
        console.error('Error setting up event source:', e);
      }
    }

    return () => {
      if (eventSource) {
        console.log('Cleanup: closing EventSource');
        eventSource.close();
        setStreaming(false);
      }
    };
  }, [streamUrl, game, streaming, chess]);

  // Convert tournament game status to Game status
  const getGameStatus = (status?: string): GameStatus => {
    if (!status) return GameStatus.NOT_STARTED;
    if (status === 'started') return GameStatus.IN_PROGRESS;
    if (status === 'finished') return GameStatus.WHITE_WIN; // Default to WHITE_WIN as a fallback
    return GameStatus.ABORTED;
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
      <div className="back-button-container">
        <button onClick={onBack} className="back-button">
          &larr; Back to Tournament
        </button>
        {streaming && <span className="streaming-indicator">🔴 LIVE</span>}
      </div>

      <div className="chess-match-container">
        <div className="game-info-container">
          <h2 className="tournament-title">{game.name || 'Tournament Game'}</h2>
        </div>
        <div>
          <PlayerInfo
            icon={playerIconBlack}
            fen={fen}
            name={game.players?.black?.name}
            elo={game.players?.black?.rating}
            time={600} // Default time for tournament games if not available
            isBlack={true}
            gameStatus={getGameStatus(game.status)}
            updatedAt={game.updated_at}
          />
          <div className="chessboard">
            <Chessground
              width={450}
              height={450}
              config={{
                ...config,
                fen,
                lastMove,
                drawable: {
                  ...config.drawable,
                  autoShapes,
                },
              }}
            />
          </div>
          <PlayerInfo
            icon={playerIconWhite}
            fen={fen}
            name={game.players?.white?.name}
            elo={game.players?.white?.rating}
            time={600} // Default time for tournament games if not available
            isBlack={false}
            gameStatus={getGameStatus(game.status)}
            updatedAt={game.updated_at}
          />
        </div>

        <div className="move-history">
          <h3>Moves</h3>
          <div className="moves-list">
            {moves.map((move, index) => (
              <span
                key={`${move}-${index}`}
                className={index === currentMoveIndex ? 'move active' : 'move'}
              >
                {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}{' '}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentGameViewer;