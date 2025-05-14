import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import Chessground from '@react-chess/chessground';
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
import EvaluationBar from './EvaluationBar';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById } from 'store/actionCreators/gameActionCreators';
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
import './dark-style.scss';

interface ChessMatchProps {
  joinGame: typeof joinGame;
  leaveGame: typeof leaveGame;
  fetchGameById: typeof fetchGameById;
  createWager: typeof createWager;
  onEnterMovePanel: any; // Using any to bypass type incompatibility
  onLeaveMovePanel: any;
  onMoveHover: any;
  onMoveUnhover: any;
  createNewArrows: any; // Using any for consistency with other action creators
  games: Record<string, Game>;
  showModal: Record<string, boolean>;
  config: Config;
  autoShapes: DrawShape[];
  showAutoShapes: boolean;
  isAuthenticated: boolean;
  balance: number | undefined;
  rankings: Rank[];
}

const ChessMatch: React.FC<ChessMatchProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();
  const game: Game | undefined = props.games[gameId];
  const groundWrapperRef = useRef<HTMLDivElement>(null);

  // Default stake for placing bets directly
  const [selectedStake, setSelectedStake] = useState<number>(10);

  useEffect(() => {
    props.fetchGameById(gameId);
    props.joinGame(gameId);
    return () => { props.leaveGame(gameId); };
  }, []);

  useEffect(() => {
    // Set up polling for game updates
    const pollInterval = setInterval(() => {
      props.fetchGameById(gameId);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [gameId, props.fetchGameById]);

  // Handle drag-and-drop move - now places bet directly using the integrated sidebar
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
        // Place the bet immediately with the current stake
        props.createWager(
          gameId,
          move.san,
          selectedStake,
          false, // not WDL
          1, // Default odds - will be calculated server-side based on pool
          game.move_hist.length + 1,
        );

        // Reset board to original position
        chess.undo();
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

      {/* Drag Wager Sidebar - positioned on the left side of the board */}

      {/* Drag & Drop Tip */}
      <DragDropTip isAuthenticated={props.isAuthenticated} />

      <div className="dark-game-page">
        {/* Top navigation bar */}
        <div className="top-nav">
          <div className="logo-container">
            <img src={logoSvg} alt="BetMate" className="logo" />
            <h1 className="logo-text">BetMate</h1>
          </div>

          {props.isAuthenticated && (
            <CoinBalance balance={props.balance} />
          )}
        </div>

        {/* Main content area */}
        <div className="game-content">
          {/* Left column - Chessboard */}
          {/* Integrated betting sidebar handles drag-to-bet now */}

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
                  <Chessground
                    contained
                    config={{
                      ...props.config,
                      coordinates: true,
                      viewOnly: props.isAuthenticated ? false : true, // Allow moves only for authenticated users
                      turnColor: game.state.includes(' w ') ? 'white' : 'black', // Determine current turn from FEN
                      movable: props.isAuthenticated ? {
                        free: false, // Don't allow free movement - must be valid chess moves
                        color: 'both', // Allow moving both colors for betting purposes
                        dests: getValidMoves(game.state), // Get valid moves from current position
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

          {/* Right column - Split into two parts for mobile */}
          <div className="sidebar-container">
            {/* Top section - Betting options */}
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
              />
            </div>

            {/* Bottom section - Chat and extras */}
            <div className="chat-extras-section">
              <ChatBox />
              <MiniLeaderboard rankings={props.rankings || []} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChessMatch;
