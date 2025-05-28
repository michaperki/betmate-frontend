import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ROOT_URL } from 'utils';
import './style.scss';

interface MoveData {
  move: string;
  score: number;
  percentile: number;
  is_best_move: boolean;
}

interface MoveBubblesProps {
  gameId: string;
  gameState: string;
  moveOptions?: string[];
  moveWagers?: {
    options: string[];
    wagers: Array<{ amount: number; data: string }>;
  };
  selectedStake: number;
  isAuthenticated: boolean;
  onMoveBet: (move: string, stake: number) => void;
  onMoveHover: (arrows: Array<{ orig: string; dest: string }>) => void;
  onMoveUnhover: () => void;
  hoveredMove?: string | null;
  pendingBet?: {
    moveString: string;
    stake: number;
    gameId: string;
    isActive: boolean;
  } | null;
}

const MoveBubbles: React.FC<MoveBubblesProps> = ({
  gameId,
  gameState,
  moveOptions,
  moveWagers,
  selectedStake,
  isAuthenticated,
  onMoveBet,
  onMoveHover,
  onMoveUnhover,
  hoveredMove,
  pendingBet,
}) => {
  const [topMoves, setTopMoves] = useState<MoveData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHolding, setIsHolding] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const progressTimerRef = useRef<number | null>(null);
  const lastGameStateRef = useRef<string>('');

  const HOLD_DURATION = 600; // 600ms hold time
  const ANIMATION_DURATION = 300; // 300ms animation duration


  // Animate out old moves when game state changes
  const animateOutAndFetch = async () => {
    if (topMoves.length > 0 && lastGameStateRef.current !== gameState) {
      setAnimatingOut(true);
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
    }

    setIsLoading(true);
    console.log('[MoveBubbles] Fetching top moves for FEN:', gameState);

      try {
        // Use the backend analysis endpoint for top moves
        const response = await fetch(`${ROOT_URL}/analysis/top-moves?fen=${encodeURIComponent(gameState)}&n=6`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        console.log('[MoveBubbles] Top moves response:', data);

        // Parse Lambda response format (data.body contains the actual response)
        let parsedData;
        if (data.body) {
          try {
            parsedData = JSON.parse(data.body);
          } catch (error) {
            console.error('[MoveBubbles] Failed to parse response body:', error);
            parsedData = data;
          }
        } else {
          parsedData = data;
        }

        console.log('[MoveBubbles] Parsed response:', parsedData);

        if (parsedData.message === 'SUCCESS' && Array.isArray(parsedData.data)) {
          // Check if we got enhanced format (objects) or legacy format (strings)
          if (parsedData.data.length > 0 && typeof parsedData.data[0] === 'object' && parsedData.data[0].move) {
            // Enhanced format - filter out poor moves (below 40% percentile)
            const filteredMoves = parsedData.data.filter((moveData: MoveData) =>
              moveData.is_best_move || moveData.percentile >= 40
            );
            setTopMoves(filteredMoves);
            setAnimatingOut(false);
            setAnimationKey(prev => prev + 1); // Trigger slide-in animation
            lastGameStateRef.current = gameState;
            console.log('[MoveBubbles] Set top moves with REAL analysis:', filteredMoves.length, 'moves (filtered from', parsedData.data.length, ')');
          } else {
            console.warn('[MoveBubbles] No valid move data available');
            setTopMoves([]);
            setAnimatingOut(false);
          }
        } else {
          console.warn('[MoveBubbles] Invalid response format or no moves:', parsedData);
          setTopMoves([]);
          setAnimatingOut(false);
        }
      } catch (error) {
        console.error('[MoveBubbles] Failed to fetch top moves:', error);
        setTopMoves([]);
        setAnimatingOut(false);
      } finally {
        setIsLoading(false);
      }
    };

  // Fetch top moves with animation
  useEffect(() => {
    if (!gameState) {
      console.log('[MoveBubbles] No game state available');
      return;
    }

    // Add a small delay to avoid race conditions with game state updates
    const timeoutId = setTimeout(animateOutAndFetch, 100);
    return () => clearTimeout(timeoutId);
  }, [gameState]);

  // Clear hold timers
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

  // Handle tap to show arrow
  const handleTap = (move: string) => {
    if (!gameState) return;

    const chess = new Chess(gameState);
    try {
      const moveObj = chess.move(move, { sloppy: true });
      if (moveObj) {
        onMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
      }
      chess.undo(); // Reset position
    } catch (e) {
      console.error('Invalid move', e);
    }
  };

  // Handle tap and hold to place bet
  const handleBetStart = (move: string) => (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAuthenticated || !selectedStake) return;

    e.preventDefault();
    e.stopPropagation();

    // Prevent context menu on mobile
    if ('ontouchstart' in window) {
      document.addEventListener('contextmenu', preventContextMenu, { once: true });
    }

    setIsHolding(move);
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
      onMoveBet(move, selectedStake);
      handleBetEnd();
    }, HOLD_DURATION);
  };

  // Prevent context menu during touch interactions
  const preventContextMenu = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleBetEnd = () => {
    clearHoldTimers();
    setIsHolding(null);
    setHoldProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHoldTimers();
    };
  }, []);

  // Get bubble styling based on move quality
  const getBubbleClass = (moveData: MoveData): string => {
    const { percentile, is_best_move } = moveData;

    let qualityClass = '';
    if (is_best_move || percentile >= 90) {
      qualityClass = 'best-move';
    } else if (percentile >= 70) {
      qualityClass = 'good-move';
    } else if (percentile >= 40) {
      qualityClass = 'decent-move';
    } else {
      qualityClass = 'poor-move';
    }

    return qualityClass;
  };

  // Get the sweep color based on move quality
  const getSweepColor = (moveData: MoveData): string => {
    const { percentile, is_best_move } = moveData;

    if (is_best_move || percentile >= 90) {
      return '#00D49A'; // Darker shade of best-move green
    } else if (percentile >= 70) {
      return '#22C55E'; // Darker shade of good-move green
    } else if (percentile >= 40) {
      return '#F59E0B'; // Darker shade of decent-move yellow
    } else {
      return '#DC2626'; // Darker shade of poor-move red
    }
  };

  // Get quality badge text
  const getQualityBadge = (moveData: MoveData): string | null => {
    const { percentile, is_best_move } = moveData;

    if (is_best_move) return 'BEST';
    if (percentile >= 90) return 'EXCELLENT';
    if (percentile >= 70) return 'GOOD';
    return null; // No badge for decent moves, and poor moves are filtered out
  };

  // Calculate total wagers for a move from actual wager data
  const getTotalWagered = (move: string): number => {
    if (!moveWagers?.wagers) return 50; // Default minimum

    return moveWagers.wagers
      .filter(wager => wager.data === move)
      .reduce((total, wager) => total + wager.amount, 0) || 50; // Default minimum
  };

  // Get bubble size based on total wagered
  const getBubbleSize = (totalWagered: number): string => {
    if (totalWagered > 300) return 'large';
    if (totalWagered > 150) return 'medium';
    return 'small';
  };

  // Only show loading if we don't have moves and aren't animating
  if (isLoading && topMoves.length === 0 && !animatingOut) {
    return (
      <div className="move-bubbles-container">
        <div className="move-bubbles-loading">
          <div className="loading-spinner"></div>
          <span>Loading moves...</span>
        </div>
      </div>
    );
  }

  if (topMoves.length === 0) {
    return (
      <div className="move-bubbles-container">
        <div className="no-moves">No moves available</div>
      </div>
    );
  }

  // Determine if we need scrollable layout (more than 5 bubbles)
  const isScrollable = topMoves.length > 5;

  return (
    <div className="move-bubbles-container">
      <div className={`move-bubbles-scroll ${animatingOut ? 'animating-out' : ''} ${isScrollable ? 'scrollable' : ''}`} key={animationKey}>
        {topMoves.map((moveData, index) => {
          const totalWagered = getTotalWagered(moveData.move);
          const qualityBadge = getQualityBadge(moveData);
          const isCurrentMove = hoveredMove === moveData.move;
          const isPendingBet = pendingBet?.isActive && pendingBet.moveString === moveData.move;
          const isCurrentlyHolding = isHolding === moveData.move;

          return (
            <div
              key={`${moveData.move}-${index}`}
              className={`move-bubble ${getBubbleClass(moveData)} ${getBubbleSize(totalWagered)}
                         ${isCurrentMove ? 'hovered' : ''}
                         ${isPendingBet ? 'pending' : ''}
                         ${isCurrentlyHolding ? 'holding' : ''}
                         ${isAuthenticated ? 'authenticated' : ''}
                         bubble-animate-in`}
              style={{
                animationDelay: `${index * 50}ms`,
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isCurrentlyHolding) {
                  handleTap(moveData.move);
                }
              }}
              onMouseDown={handleBetStart(moveData.move)}
              onMouseUp={handleBetEnd}
              onMouseLeave={handleBetEnd}
              onTouchStart={handleBetStart(moveData.move)}
              onTouchEnd={handleBetEnd}
              onTouchCancel={handleBetEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
            >
              {/* Quality badge */}
              {qualityBadge && (
                <div className="quality-badge">{qualityBadge}</div>
              )}

              {/* Move notation */}
              <div className="move-text">{moveData.move}</div>

              {/* Wager amount */}
              <div className="wager-amount">{totalWagered}</div>

              {/* Hold progress border ring */}
              {isCurrentlyHolding && (
                <div
                  className="hold-progress-border"
                  style={{
                    background: `conic-gradient(from 270deg, ${getSweepColor(moveData)} ${holdProgress * 3.6}deg, transparent ${holdProgress * 3.6}deg)`,
                    mask: 'radial-gradient(circle, transparent 65%, black 70%)',
                    WebkitMask: 'radial-gradient(circle, transparent 65%, black 70%)'
                  }}
                />
              )}

              {/* Percentile score (for debugging/development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="debug-percentile">{moveData.percentile}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoveBubbles;