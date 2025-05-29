/* eslint-disable no-nested-ternary */
import React, { useState, useEffect, useRef } from 'react';
import { gameOver, gameInProgress } from 'utils/chess';
import { GameStatus } from 'types/resources/game';
import { GameOdds } from 'types/resources/game';
import './dark-style.scss';
import balanceIcon from 'assets/wager_panel/balance-icon.svg';

interface ChessMatchProps {
  icon: string,
  fen: string,
  name: string | undefined,
  elo: number | undefined,
  time: number | undefined,
  isBlack: boolean,
  gameStatus: GameStatus,
  updatedAt: string | undefined,
  // Betting props
  onOutcomeBet?: (outcome: string, stake: number) => void,
  gameOdds?: GameOdds,
  selectedStake?: number,
  isAuthenticated?: boolean,
  currentWagers?: { amount: number },
  gameId?: string,
  // Wager totals
  wagerTotal?: number
}

const PlayerInfo: React.FC<ChessMatchProps> = (props) => {
  const [playerTime, setTime] = useState(props.time ?? 0);
  const blackTurn = props.fen?.split(' ')[1] === 'b';
  const isGameOver = gameOver(props.gameStatus);
  const isGameInProgress = gameInProgress(props.gameStatus);
  const isPlayerTurn = props.isBlack === blackTurn && isGameInProgress;
  const [timer, setTimer] = useState(setInterval(() => {}, 1000000));

  // Betting state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const progressTimerRef = useRef<number | null>(null);

  const HOLD_DURATION = 800; // 800ms hold time

  useEffect(() => { // Update timers
    const doDecrease = playerTime >= 0 && isPlayerTurn;
    const [decrease, interval] = (
      !doDecrease ? [0, 1000000]
        : playerTime >= 60 ? [1, 1000]
          : [0.1, 100]
    );

    clearInterval(timer);
    setTimer(setInterval(() => setTime((t) => Math.max(t - decrease, 0)), interval));
  }, [blackTurn]);

  useEffect(() => {
    if (Math.round(playerTime) === 60) {
      const [decrease, interval] = [0.1, 100];
      clearInterval(timer);
      setTimer(setInterval(() => setTime((t) => t - decrease), interval));
    }
  }, [playerTime]);

  useEffect(() => { // Update time after every move
    if (props.fen) {
      const adjustment = playerTime === 0 && isPlayerTurn
        ? (new Date().getTime() - new Date(props.updatedAt ?? '').getTime()) / 1000
        : 0;

      setTime((time) => Math.round(((props.time ?? 0) + (time % 1) - adjustment) * 10) / 10);
    }
  }, [props.time, props.fen]);

  useEffect(() => {
    if (isGameOver) { // Clear timer when game is over
      clearInterval(timer);
    }
  }, [isGameOver]);

  // Get timer format
  const getTimeString = (time: number): string => {
    try {
      const timeString = new Date((time ?? 0) * 1000).toISOString();

      if (time > 3600) { // Over an hour
        return timeString.substr(11, 8);
      } else if (time > 60) { // Over a minute
        return timeString.substr(14, 5);
      } else { // Less than a minute
        return timeString.substr(17, 4);
      }
    } catch (error) {
      setTime(props.time ?? 0);
      return '00.0';
    }
  };

  // Betting functionality
  const clearHoldTimers = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handleBetStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!props.isAuthenticated || !props.onOutcomeBet || !props.selectedStake || !isGameInProgress) return;

    e.preventDefault();
    setIsHolding(true);
    setHoldProgress(0);
    holdStartRef.current = Date.now();

    // Progress animation
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 16); // ~60fps

    // Complete bet on hold duration
    holdTimerRef.current = window.setTimeout(() => {
      const outcome = props.isBlack ? 'black_win' : 'white_win';
      props.onOutcomeBet?.(outcome, props.selectedStake!);
      handleBetEnd();
    }, HOLD_DURATION);
  };

  const handleBetEnd = () => {
    clearHoldTimers();
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Get betting display info
  const getOdds = () => {
    if (!props.gameOdds) return null;
    const outcome = props.isBlack ? 'black_win' : 'white_win';
    return props.gameOdds[outcome];
  };

  const getMultiplier = () => {
    const odds = getOdds();
    return odds ? (1 / odds).toFixed(1) : '0.0';
  };

  const getPayout = () => {
    const odds = getOdds();
    const stake = props.selectedStake || 0;
    return odds ? (stake / odds).toFixed(0) : '0';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHoldTimers();
    };
  }, []);

  const canBet = props.isAuthenticated && props.onOutcomeBet && props.selectedStake && isGameInProgress;

  return (
    <div
      className={`player-info-dark ${isPlayerTurn ? 'player-turn' : ''} ${isHolding ? 'betting-active' : ''} ${canBet ? 'can-bet' : ''}`}
      onMouseDown={canBet ? handleBetStart : undefined}
      onMouseUp={canBet ? handleBetEnd : undefined}
      onMouseLeave={canBet ? handleBetEnd : undefined}
      onTouchStart={canBet ? handleBetStart : undefined}
      onTouchEnd={canBet ? handleBetEnd : undefined}
    >
      <div className="player-icon-stake">
        <img
          src={props.icon}
          alt={props.isBlack ? 'Black player' : 'White player'}
          className="player-avatar"
        />
        {canBet && (
          <div className="bet-stake">{props.selectedStake}</div>
        )}
      </div>

      <div className="player-identity">
        <div className="player-name">{props.name || 'Unknown'}</div>
        <div className="player-stats">
          {props.elo !== undefined && (
            <span className="player-elo">{props.elo}</span>
          )}
          {props.wagerTotal !== undefined && props.wagerTotal > 0 && (
            <span className="wager-total-display">
              <img src={balanceIcon} alt="Total wagered" className="wager-total-icon" />
              <span className="wager-total-amount">{props.wagerTotal}</span>
            </span>
          )}
        </div>
      </div>

      {canBet && (
        <div className="bet-info">
          <div className="bet-multiplier">{getMultiplier()}x</div>
          <div className="bet-payout">→{getPayout()}</div>
          {props.currentWagers?.amount && (
            <div className="current-wager">
              ({props.currentWagers.amount})
            </div>
          )}
        </div>
      )}

      <div className={`player-timer ${isPlayerTurn ? 'active' : ''}`}>
        {getTimeString(playerTime)}
      </div>

      {isHolding && (
        <div className="hold-progress">
          <div
            className="progress-bar"
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default PlayerInfo;
