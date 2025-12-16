import React, { useState, useEffect, useRef } from 'react';
import { gameInProgress } from 'utils/chess';
import { GameStatus } from 'types/resources/game';
import { GameOdds } from 'types/resources/game';
import './style.scss';
import { useMode } from 'context/ModeContext';
import { realWdlMultiplier } from 'utils/realOdds';

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
  const { mode, risk } = useMode();
  
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
    const p = getOdds();
    if (!p) return '0.0';
    if (mode === 'real') {
      const mult = realWdlMultiplier('draw', p, undefined, risk as any);
      return mult.toFixed(1);
    }
    return (1 / p).toFixed(1);
  };

  const getPayout = () => {
    const p = getOdds();
    const stake = props.selectedStake || 0;
    if (!p) return '0';
    if (mode === 'real') {
      const mult = realWdlMultiplier('draw', p, undefined, risk as any);
      return Math.round(stake * mult).toString();
    }
    return (stake / p).toFixed(0);
  };

  // Add touch event listeners with passive: false option
  useEffect(() => {
    const bubbleElement = document.querySelector('.draw-bet-bubble');

    // Touch event handlers with non-passive option
    const touchStartHandler = (e: TouchEvent) => {
      if (props.isAuthenticated && props.onOutcomeBet && props.selectedStake && isGameInProgress) {
        e.preventDefault();
        handleBetStart(e as unknown as React.TouchEvent);
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (props.isAuthenticated && props.onOutcomeBet && props.selectedStake && isGameInProgress) {
        handleBetEnd();
      }
    };

    // Add event listeners with passive: false
    if (bubbleElement && props.isAuthenticated && props.onOutcomeBet && props.selectedStake && isGameInProgress) {
      bubbleElement.addEventListener('touchstart', touchStartHandler, { passive: false });
      bubbleElement.addEventListener('touchend', touchEndHandler, { passive: false });
    }

    // Cleanup on unmount
    return () => {
      clearHoldTimers();
      if (bubbleElement) {
        bubbleElement.removeEventListener('touchstart', touchStartHandler);
        bubbleElement.removeEventListener('touchend', touchEndHandler);
      }
    };
  }, [props.isAuthenticated, props.onOutcomeBet, props.selectedStake, isGameInProgress]);

  // Define canBet variable for UI rendering
  const canBet = props.isAuthenticated && props.onOutcomeBet && props.selectedStake && isGameInProgress;

  return (
    <div
      className={`draw-bet-bubble ${isHolding ? 'betting-active' : ''} ${canBet ? 'interactive' : ''}`}
      onMouseDown={canBet ? handleBetStart : undefined}
      onMouseUp={canBet ? handleBetEnd : undefined}
      onMouseLeave={canBet ? handleBetEnd : undefined}
    >
      {/* Handshake Icon */}
      <div className="draw-icon">
        🤝
      </div>

      {/* Vertical DRAW text */}
      <div className="draw-text-vertical">
        <span>D</span>
        <span>R</span>
        <span>A</span>
        <span>W</span>
      </div>

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
