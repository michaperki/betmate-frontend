import React, { useState, useEffect, useRef } from 'react';
import { gameInProgress } from 'utils/chess';
import { GameStatus } from 'types/resources/game';
import { GameOdds } from 'types/resources/game';
import './style.scss';

interface DrawBetBubbleProps {
  gameStatus: GameStatus;
  onOutcomeBet?: (outcome: string, stake: number) => void;
  gameOdds?: GameOdds;
  selectedStake?: number;
  isAuthenticated?: boolean;
  currentWagers?: { amount: number };
  gameId?: string;
}

const DrawBetBubble: React.FC<DrawBetBubbleProps> = (props) => {
  const isGameInProgress = gameInProgress(props.gameStatus);
  
  // Betting state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const progressTimerRef = useRef<number | null>(null);

  const HOLD_DURATION = 800; // 800ms hold time

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
      props.onOutcomeBet?.('draw', props.selectedStake!);
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
    return props.gameOdds.draw;
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
      className={`draw-bet-bubble ${isHolding ? 'betting-active' : ''} ${canBet ? 'interactive' : ''}`}
      onMouseDown={canBet ? handleBetStart : undefined}
      onMouseUp={canBet ? handleBetEnd : undefined}
      onMouseLeave={canBet ? handleBetEnd : undefined}
      onTouchStart={canBet ? handleBetStart : undefined}
      onTouchEnd={canBet ? handleBetEnd : undefined}
    >
      {/* Handshake Icon */}
      <div className="draw-icon">
        🤝
      </div>

      {/* Draw Label */}
      <div className="draw-label">DRAW</div>

      {/* Betting Info - integrated into the bubble */}
      {canBet && (
        <>
          <div className="bet-stake">{props.selectedStake}</div>
          <div className="bet-multiplier">{getMultiplier()}x</div>
          <div className="bet-payout">→{getPayout()}</div>

          {props.currentWagers?.amount && (
            <div className="current-wager">
              {props.currentWagers.amount}
            </div>
          )}
        </>
      )}

      {/* Progress bar for hold action */}
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

export default DrawBetBubble;