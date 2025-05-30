import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import ChessgroundWrapper from '../../components/ChessgroundWrapper';
import { DrawShape } from 'chessground/draw';
import { Config } from 'chessground/config';
import { Key, MoveMetadata } from 'chessground/types';
import { Chess } from 'chess.js';
import PlayerInfo from 'containers/ChessMatch/playerInfo/component';
import CoinBalance from 'components/CoinBalance';
import PregameModal from 'components/PregameModal';
import PostgameModal from 'components/PostgameModal';
import GameEndOverlay from 'components/GameEndOverlay';
import DragDropTip from 'components/DragDropTip';
import GameCommunication from '../../components/GameCommunication';
import MoveBubbles from 'components/MoveBubbles';
import MiniLeaderboard from 'components/BettingSidebar/MiniLeaderboard';
import NavBar from 'components/NavBar';
import GameInfoPanel from 'components/GameInfoPanel';
import EvaluationBar from './EvaluationBar';
import balanceIcon from 'assets/wager_panel/balance-icon.svg';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById, fetchGameStats, setPendingBet, clearPendingBet, toggleQuickBet } from 'store/actionCreators/gameActionCreators';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { gameOver, gameInProgress, getValidMoves } from 'utils/chess';
import { Game, GameStatus } from 'types/resources/game';
import { Rank } from 'types/leaderboard';
import playerIconBlack from 'assets/player_icon_black.svg';
import playerIconWhite from 'assets/player_icon_white.svg';
import logoSvg from 'assets/logo.svg';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.scss';
import './dark-style.scss';
import '../../components/GameInfoPanel/style.scss';

interface ChessMatchProps {
  joinGame: typeof joinGame;
  leaveGame: typeof leaveGame;
  fetchGameById: typeof fetchGameById;
  fetchGameStats: typeof fetchGameStats;
  createWager: typeof createWager;
  setPendingBet: typeof setPendingBet;
  clearPendingBet: typeof clearPendingBet;
  toggleQuickBet: typeof toggleQuickBet;
  onEnterMovePanel: any; // Using any to bypass type incompatibility
  onLeaveMovePanel: any;
  onMoveHover: any;
  onMoveUnhover: any;
  createNewArrows: any; // Using any for consistency with other action creators
  getGameLeaderboard: (gameId: string) => void;
  games: Record<string, Game>;
  gameStats: Record<string, any>;
  showModal: Record<string, boolean>;
  config: Config;
  autoShapes: DrawShape[];
  showAutoShapes: boolean;
  isAuthenticated: boolean;
  balance: number | undefined;
  rankings: Rank[];
  quickBetMode: boolean;
  pendingBet: {
    moveString: string;
    stake: number;
    gameId: string;
    isActive: boolean;
  } | null;
  resolvedWagers: any[]; // Add resolvedWagers prop
}

const ChessMatch: React.FC<ChessMatchProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();
  const game: Game | undefined = props.games[gameId];
  const gameStats = props.gameStats[gameId];
  const groundWrapperRef = useRef<HTMLDivElement>(null);

  // Default stake for placing bets directly
  const [selectedStake, setSelectedStake] = useState<number>(10);

  // Draw betting state
  const [isDrawHolding, setIsDrawHolding] = useState(false);
  const [drawHoldProgress, setDrawHoldProgress] = useState(0);
  const drawHoldTimerRef = useRef<number | null>(null);
  const drawHoldStartRef = useRef<number>(0);
  const drawProgressTimerRef = useRef<number | null>(null);

  // User-submitted moves from drag-and-drop
  const [userSubmittedMoves, setUserSubmittedMoves] = useState<Set<string>>(new Set());

  // User-interacted moves (includes moves already in AI suggestions)
  const [userInteractedMoves, setUserInteractedMoves] = useState<Set<string>>(new Set());

  const DRAW_HOLD_DURATION = 800; // 800ms hold time

  useEffect(() => {
    props.fetchGameById(gameId);
    props.fetchGameStats(gameId);
    props.joinGame(gameId);
    props.getGameLeaderboard(gameId);
    return () => { props.leaveGame(gameId); };
  }, []);

  // Clear user-submitted moves when game state changes (after a real move is made)
  useEffect(() => {
    setUserSubmittedMoves(new Set());
    setUserInteractedMoves(new Set());
  }, [game?.state]);

  useEffect(() => {
    // Set up polling for game updates
    const pollInterval = setInterval(() => {
      props.fetchGameById(gameId);
      props.fetchGameStats(gameId);
      props.getGameLeaderboard(gameId); // Add leaderboard to polling
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [gameId, props.fetchGameById, props.fetchGameStats, props.getGameLeaderboard]);

  // Handle drag-and-drop move - now respects quick bet mode
  const handleDragMove = (orig: Key, dest: Key, metadata?: MoveMetadata) => {
    if (!game) return;

    // Convert from/to positions to SAN notation
    const chess = new Chess(game.state);
    try {
      const move = chess.move({
        from: orig.toString() as any, // Cast to any to bypass type incompatibility
        to: dest.toString() as any,   // between Key and Square types
        promotion: 'q' // Default to queen for simplicity
      });

      if (move) {
        // Track all user interactions (both new moves and existing AI moves)
        setUserInteractedMoves(prev => new Set(prev).add(move.san));

        // Add the user's move to the candidate moves list (for new moves only)
        setUserSubmittedMoves(prev => new Set(prev).add(move.san));

        // Make sure the move panel is active to show arrows
        props.onEnterMovePanel();

        // Show arrow for the move
        console.log('Drag-drop: Adding arrow for move:', { orig: orig.toString(), dest: dest.toString(), san: move.san });
        props.onMoveHover([{ orig: orig.toString(), dest: dest.toString() }]);

        if (props.quickBetMode) {
          // Place bet immediately if in quick bet mode
          props.createWager(
            gameId,
            move.san,
            selectedStake,
            false, // not WDL
            1, // Default odds - will be calculated server-side based on pool
            game.move_hist.length + 1,
          );

          // Clear the arrow after placing the bet in quick mode
          setTimeout(() => {
            if (props.onMoveUnhover) {
              props.onMoveUnhover();
            }
          }, 1000); // Leave arrow visible briefly for feedback
        } else {
          // Clear any existing pending bet first
          props.clearPendingBet();

          // Show the move arrow - the MoveBubbles component will now include this move
          // Keep arrow visible for visual feedback
          setTimeout(() => {
            if (props.onMoveUnhover) {
              props.onMoveUnhover();
            }
          }, 2000); // Keep arrow visible for 2 seconds for feedback
        }

        // Reset board to original position but keep the arrow showing
        chess.undo();

        // Don't call onMoveUnhover here as we want the arrow to stay visible
      }
    } catch (e) {
      console.error('Invalid move', e);
    }
  };

  // Draw betting functionality
  const clearDrawHoldTimers = () => {
    if (drawHoldTimerRef.current) {
      window.clearTimeout(drawHoldTimerRef.current);
      drawHoldTimerRef.current = null;
    }
    if (drawProgressTimerRef.current) {
      window.clearInterval(drawProgressTimerRef.current);
      drawProgressTimerRef.current = null;
    }
  };

  const handleDrawBetStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent context menu on mobile
    if ('ontouchstart' in window) {
      document.addEventListener('contextmenu', preventContextMenu, { once: true });
    }

    setIsDrawHolding(true);
    setDrawHoldProgress(0);
    drawHoldStartRef.current = Date.now();

    // Progress animation
    drawProgressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - drawHoldStartRef.current;
      const progress = Math.min((elapsed / DRAW_HOLD_DURATION) * 100, 100);
      setDrawHoldProgress(progress);
    }, 16); // ~60fps

    // Complete bet on hold duration
    drawHoldTimerRef.current = window.setTimeout(() => {
      props.createWager(
        gameId,
        'draw',
        selectedStake,
        true, // is WDL
        1 / (game?.odds?.['draw'] || 1),
        game.move_hist.length + 1,
      );
      handleDrawBetEnd();
    }, DRAW_HOLD_DURATION);
  };

  // Prevent context menu during touch interactions
  const preventContextMenu = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleDrawBetEnd = () => {
    clearDrawHoldTimers();
    setIsDrawHolding(false);
    setDrawHoldProgress(0);
  };

  // Define game progress state before it's used in the effect
  const isGameInProgress = game ? gameInProgress(game.game_status as GameStatus) : false;

  // Add touch event listeners with passive: false option
  useEffect(() => {
    // Ensure we're not running this effect before game data is loaded
    if (!game) return;
    const drawBetButton = document.querySelector('.draw-bet-button');

    // Touch event handlers with non-passive option
    const touchStartHandler = (e: TouchEvent) => {
      if (props.isAuthenticated && selectedStake && isGameInProgress) {
        handleDrawBetStart(e as unknown as React.TouchEvent);
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (props.isAuthenticated && selectedStake && isGameInProgress) {
        handleDrawBetEnd();
      }
    };

    const touchCancelHandler = (e: TouchEvent) => {
      if (props.isAuthenticated && selectedStake && isGameInProgress) {
        handleDrawBetEnd();
      }
    };

    // Add event listeners with passive: false
    if (drawBetButton) {
      drawBetButton.addEventListener('touchstart', touchStartHandler, { passive: false });
      drawBetButton.addEventListener('touchend', touchEndHandler, { passive: false });
      drawBetButton.addEventListener('touchcancel', touchCancelHandler, { passive: false });
    }

    // Cleanup on unmount
    return () => {
      clearDrawHoldTimers();
      if (drawBetButton) {
        drawBetButton.removeEventListener('touchstart', touchStartHandler);
        drawBetButton.removeEventListener('touchend', touchEndHandler);
        drawBetButton.removeEventListener('touchcancel', touchCancelHandler);
      }
    };
  }, [props.isAuthenticated, selectedStake, isGameInProgress]);

  // Moving this variable declaration before its usage in the useEffect

  if (!game) {
    return (
      <div className="loading-container">
        <div className="loading-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {game.game_status === GameStatus.NOT_STARTED && props.showModal[gameId] && <PregameModal/>}
      {gameOver(game.game_status as GameStatus) && (
        <>
          {/* Display both the overlay and the modal */}
          <PostgameModal />
        </>
      )}

      {/* Drag & Drop Tip */}
      <DragDropTip isAuthenticated={props.isAuthenticated} />

      {/* Using a structure similar to index.html for consistent page layout */}
      <div className="dark-game-page">
        {/* Top navigation bar - Using the compact variant of NavBar */}
        <NavBar compact={true} />

        {/* Main content area */}
        <div className="game-content">
          {/* Left column - Leaderboard on larger screens */}
          <div className="left-sidebar-container">
              {/* Leaderboard section */}
              <div className="leaderboard-section">
                <MiniLeaderboard rankings={props.rankings || []} />
              </div>
            </div>

            {/* Middle column - Chessboard */}
            <div className="board-container">

              <PlayerInfo
                icon={playerIconBlack}
                fen={game?.state ?? ''}
                name={game?.player_black?.name}
                elo={game?.player_black?.elo}
                time={game?.time_black}
                isBlack={true}
                gameStatus={(game?.game_status ?? GameStatus.IN_PROGRESS) as GameStatus}
                updatedAt={game?.updated_at}
                onOutcomeBet={(outcome, stake) => {
                  props.createWager(
                    gameId,
                    outcome,
                    stake,
                    true, // is WDL
                    1 / (game?.odds?.[outcome] || 1),
                    game.move_hist.length + 1,
                  );
                }}
                gameOdds={game?.odds}
                selectedStake={selectedStake}
                isAuthenticated={props.isAuthenticated}
                gameId={gameId}
                wagerTotal={gameStats?.wdlWagerTotals?.['black_win']?.totalAmount || 0}
              />

              <div className="game-layout">
                <div className="board-with-eval">

                  <div className="chessboard-wrapper brown" ref={groundWrapperRef}>
                    <ChessgroundWrapper
                      config={{
                        ...props.config,
                        coordinates: true,
                        viewOnly: props.isAuthenticated ? false : true, // Allow moves only for authenticated users
                        turnColor: game.state.includes(' w ') ? 'white' : 'black', // Determine current turn from FEN
                        movable: props.isAuthenticated ? {
                          free: false, // Don't allow free movement - must be valid chess moves
                          color: 'both', // Allow moving both colors for betting purposes
                          dests: getValidMoves(game.state), // Get valid moves from current position
                          rookCastle: true, // Add this to fix the rookCastle error
                          events: {
                            after: handleDragMove // Handle drag events
                          }
                        } : undefined,
                        fen: game?.state,
                        lastMove: game?.move_hist?.length > 0
                          ? [game.move_hist[game.move_hist.length - 1].from as any, game.move_hist[game.move_hist.length - 1].to as any]
                          : undefined,
                        drawable: {
                          enabled: true,
                          visible: true,
                          defaultSnapToValidMove: true,
                          autoShapes: props.autoShapes || [], // Always use autoShapes regardless of flag
                          eraseOnClick: false,
                        },
                      }}
                    />
                    {/* Game end overlay - only shown when game is over */}
                    {gameOver(game.game_status as GameStatus) && (
                      <GameEndOverlay
                        gameStatus={game.game_status as GameStatus}
                        resolvedWagers={props.resolvedWagers}
                        gameId={gameId}
                      />
                    )}
                  </div>

                  {/* Vertical evaluation bar placed to the right of the board */}
                  <div className="eval-bar-container">
                    <EvaluationBar odds={game?.odds} />
                  </div>
                </div>
              </div>

              <PlayerInfo
                icon={playerIconWhite}
                fen={game?.state ?? ''}
                name={game?.player_white?.name}
                elo={game?.player_white?.elo}
                time={game?.time_white}
                isBlack={false}
                gameStatus={(game?.game_status ?? GameStatus.IN_PROGRESS) as GameStatus}
                updatedAt={game?.updated_at}
                onOutcomeBet={(outcome, stake) => {
                  props.createWager(
                    gameId,
                    outcome,
                    stake,
                    true, // is WDL
                    1 / (game?.odds?.[outcome] || 1),
                    game.move_hist.length + 1,
                  );
                }}
                gameOdds={game?.odds}
                selectedStake={selectedStake}
                isAuthenticated={props.isAuthenticated}
                gameId={gameId}
                wagerTotal={gameStats?.wdlWagerTotals?.['white_win']?.totalAmount || 0}
              />

              {/* Move Bubbles - positioned directly below white player */}
              <MoveBubbles
                gameId={gameId}
                gameState={game?.state ?? ''}
                moveOptions={game?.pool_wagers?.move?.options}
                moveWagers={game?.pool_wagers?.move}
                selectedStake={selectedStake}
                isAuthenticated={props.isAuthenticated}
                onMoveBet={(move, stake) => {
                  props.createWager(
                    gameId,
                    move,
                    stake,
                    false, // not WDL
                    1,
                    game.move_hist.length + 1,
                  );
                }}
                onMoveHover={props.onMoveHover}
                onMoveUnhover={props.onMoveUnhover}
                // hoveredMove={hoveredMove}  // TODO: Add if we track hovered move in parent
                pendingBet={props.pendingBet}
                userSubmittedMoves={userSubmittedMoves}
                userInteractedMoves={userInteractedMoves}
              />

              {/* Draw Bet Button - positioned below move bubbles */}
              <div className="draw-bet-button-container">
                <div
                  className={`draw-bet-button ${props.isAuthenticated && selectedStake && isGameInProgress ? 'interactive' : 'disabled'} ${isDrawHolding ? 'holding' : ''}`}
                  onMouseDown={props.isAuthenticated && selectedStake && isGameInProgress ? handleDrawBetStart : undefined}
                  onMouseUp={props.isAuthenticated && selectedStake && isGameInProgress ? handleDrawBetEnd : undefined}
                  onMouseLeave={props.isAuthenticated && selectedStake && isGameInProgress ? handleDrawBetEnd : undefined}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                >
                  <div className="draw-left-section">
                    <div className="draw-icon">🤝</div>
                    <div className="draw-label">DRAW</div>
                  </div>

                  <div className="draw-center-section">
                    <div className="draw-details">
                      <span className="stake">{selectedStake}</span>
                      <span className="multiplier">{game?.odds?.['draw'] ? (1 / game.odds['draw']).toFixed(1) : '0.0'}x</span>
                      <span className="payout">→{game?.odds?.['draw'] && selectedStake ? (selectedStake / game.odds['draw']).toFixed(0) : '0'}</span>
                    </div>
                  </div>

                  <div className="draw-right-section">
                    <div className="total-wagered">
                      <img src={balanceIcon} alt="Total wagered" />
                      <span>{gameStats?.wdlWagerTotals?.['draw']?.totalAmount || 0}</span>
                    </div>
                  </div>

                  {/* Hold progress bar */}
                  {isDrawHolding && (
                    <div className="hold-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${drawHoldProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>


          {/* Game Information Panel - Moved below main game area */}
          <div className="game-info-panel-container">
            <GameInfoPanel
              game={game}
              viewerCount={gameStats?.viewerCount || 0}
              moveWagerData={gameStats?.moveWagerData || {}}
              selectedStake={selectedStake}
              setSelectedStake={setSelectedStake}
            />

            {/* Chat and Wager Receipts - Positioned beneath Bet Amount */}
            <GameCommunication className="game-communication-panel" />
          </div>

          {/* Mobile Leaderboard - Only visible on smaller screens, now at the bottom */}
          <div className="mobile-leaderboard-container">
            <div className="mobile-leaderboard-section">
              <MiniLeaderboard rankings={props.rankings || []} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChessMatch;
