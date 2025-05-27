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
import DragDropTip from 'components/DragDropTip';
import ChatBox from 'components/ChatBox';
import IntegratedBettingSidebar from 'components/IntegratedBettingSidebar';
import MiniLeaderboard from 'components/BettingSidebar/MiniLeaderboard';
import NavBar from 'components/NavBar';
import GameInfoPanel from 'components/GameInfoPanel';
import EvaluationBar from './EvaluationBar';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById, fetchGameStats, setPendingBet, clearPendingBet, toggleQuickBet } from 'store/actionCreators/gameActionCreators';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { gameOver, getValidMoves } from 'utils/chess';
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
}

const ChessMatch: React.FC<ChessMatchProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();
  const game: Game | undefined = props.games[gameId];
  const gameStats = props.gameStats[gameId];
  const groundWrapperRef = useRef<HTMLDivElement>(null);

  // Default stake for placing bets directly
  const [selectedStake, setSelectedStake] = useState<number>(10);

  useEffect(() => {
    props.fetchGameById(gameId);
    props.fetchGameStats(gameId);
    props.joinGame(gameId);
    props.getGameLeaderboard(gameId);
    return () => { props.leaveGame(gameId); };
  }, []);

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
        // Make sure the move panel is active to show arrows
        props.onEnterMovePanel();

        // Show arrow for the move
        console.log('Drag-drop: Adding arrow for move:', { orig: orig.toString(), dest: dest.toString() });
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
          // Set as pending bet to show in sidebar with metrics
          props.setPendingBet({
            moveString: move.san,
            stake: selectedStake,
            gameId,
            isActive: true
          });
        }

        // Reset board to original position but keep the arrow showing
        chess.undo();

        // Don't call onMoveUnhover here as we want the arrow to stay visible
      }
    } catch (e) {
      console.error('Invalid move', e);
    }
  };

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
      {gameOver(game.game_status as GameStatus) && <PostgameModal/>}

      {/* Drag & Drop Tip */}
      <DragDropTip isAuthenticated={props.isAuthenticated} />

      {/* Using a structure similar to index.html for consistent page layout */}
      <div className="dark-game-page">
        {/* Top navigation bar - Using the compact variant of NavBar */}
        <NavBar compact={true} />

        {/* Main content area */}
        <div className="game-content">
          {/* Full-width Game Information Panel */}
          <div className="game-info-panel-wrapper">
            <GameInfoPanel
              game={game}
              viewerCount={gameStats?.viewerCount || 0}
              moveWagerData={gameStats?.moveWagerData || {}}
              wdlWagerTotals={gameStats?.wdlWagerTotals || {}}
            />
          </div>

          {/* Left column - Chat and wagers on larger screens */}
          <div className="left-sidebar-container">
              {/* Chat section */}
              <div className="chat-section">
                <ChatBox />
              </div>

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
              />
            </div>

            {/* Right column - Betting options */}
            <div className="right-sidebar-container">
              <div className="betting-options-section">
                <IntegratedBettingSidebar
                  isAuthenticated={props.isAuthenticated}
                  games={props.games}
                  createWager={props.createWager}
                  rankings={props.rankings}
                  onEnterMovePanel={props.onEnterMovePanel}
                  onLeaveMovePanel={props.onLeaveMovePanel}
                  onMoveHover={props.onMoveHover}
                  onMoveUnhover={props.onMoveUnhover}
                  createNewArrows={props.createNewArrows}
                  quickBetMode={props.quickBetMode}
                  toggleQuickBet={props.toggleQuickBet}
                  pendingBet={props.pendingBet}
                  setPendingBet={props.setPendingBet}
                  clearPendingBet={props.clearPendingBet}
                  selectedStake={selectedStake}
                  setSelectedStake={setSelectedStake}
                />
              </div>
            </div>

          {/* Mobile Chat Container - Only visible on smaller screens */}
          <div className="mobile-chat-container">
            <div className="chat-extras-section">
              <ChatBox />
              <div className="mobile-leaderboard-section">
                <MiniLeaderboard rankings={props.rankings || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChessMatch;
