import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
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
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const progressTimerRef = useRef<number | null>(null);
  
  const HOLD_DURATION = 800; // 800ms hold time

  // Fallback function to use existing move options or generate basic moves
  const useFallbackMoves = () => {
    if (moveOptions && Array.isArray(moveOptions) && moveOptions.length > 0) {
      console.log('[MoveBubbles] Using fallback moves from game data:', moveOptions);
      const fallbackMoves: MoveData[] = moveOptions.slice(0, 6).map((move, index) => ({
        move: move,
        score: 100 - (index * 20), // Decreasing scores
        percentile: Math.max(100 - (index * 15), 10), // Decreasing percentiles
        is_best_move: index === 0
      }));
      setTopMoves(fallbackMoves);
    } else {
      console.warn('[MoveBubbles] No fallback moves available, trying chess.js');
      // Try to generate moves using chess.js as last resort
      try {
        const chess = new Chess(gameState);
        const legalMoves = chess.moves().slice(0, 6);
        if (legalMoves.length > 0) {
          const chessJsMoves: MoveData[] = legalMoves.map((move, index) => ({
            move: move,
            score: 80 - (index * 10), // Decreasing scores
            percentile: Math.max(80 - (index * 10), 20), // Decreasing percentiles
            is_best_move: index === 0
          }));
          setTopMoves(chessJsMoves);
          console.log('[MoveBubbles] Generated moves using chess.js:', legalMoves);
        } else {
          setTopMoves([]);
        }
      } catch (error) {
        console.error('[MoveBubbles] Failed to generate moves with chess.js:', error);
        setTopMoves([]);
      }
    }
  };

  // Fetch top moves with analysis data
  useEffect(() => {
    if (!gameState) {
      console.log('[MoveBubbles] No game state available');
      return;
    }

    const fetchTopMoves = async () => {
      setIsLoading(true);
      console.log('[MoveBubbles] Fetching top moves for FEN:', gameState);

      try {
        // Use the enhanced top moves endpoint (returns analysis data)
        const response = await fetch('/dev/top-moves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            queryStringParameters: {
              fen: gameState,
              n: '6',
              enhanced: 'true'
            }
          })
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
            // Enhanced format - use real analysis data
            setTopMoves(parsedData.data);
            console.log('[MoveBubbles] Set top moves with REAL analysis:', parsedData.data.length, 'moves');
          } else if (parsedData.data.length > 0 && typeof parsedData.data[0] === 'string') {
            // Legacy format - convert to analysis objects
            const movesWithAnalysis: MoveData[] = parsedData.data.map((move: string, index: number) => ({
              move: move,
              score: 100 - (index * 15), // Placeholder scores
              percentile: Math.max(100 - (index * 12), 15), // Placeholder percentiles
              is_best_move: index === 0
            }));
            setTopMoves(movesWithAnalysis);
            console.log('[MoveBubbles] Set top moves with placeholder analysis:', movesWithAnalysis.length, 'moves');
          } else {
            console.warn('[MoveBubbles] Empty or invalid data format:', parsedData);
            useFallbackMoves();
          }
        } else {
          console.warn('[MoveBubbles] Invalid response format or no moves:', parsedData);
          // Fallback to existing move options with placeholder analysis
          useFallbackMoves();
        }
      } catch (error) {
        console.error('[MoveBubbles] Failed to fetch top moves:', error);
        // Fallback to existing move options with placeholder analysis
        useFallbackMoves();
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to avoid race conditions with game state updates
    const timeoutId = setTimeout(fetchTopMoves, 100);
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

  // Get quality badge text
  const getQualityBadge = (moveData: MoveData): string | null => {
    const { percentile, is_best_move } = moveData;
    
    if (is_best_move) return 'BEST';
    if (percentile >= 90) return 'EXCELLENT';
    if (percentile >= 70) return 'GOOD';
    if (percentile < 30) return 'POOR';
    return null;
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

  if (isLoading) {
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

  return (
    <div className="move-bubbles-container">
      <div className="move-bubbles-scroll">
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
                         ${isAuthenticated ? 'authenticated' : ''}`}
              onClick={() => handleTap(moveData.move)}
              onMouseDown={handleBetStart(moveData.move)}
              onMouseUp={handleBetEnd}
              onMouseLeave={handleBetEnd}
              onTouchStart={handleBetStart(moveData.move)}
              onTouchEnd={handleBetEnd}
            >
              {/* Quality badge */}
              {qualityBadge && (
                <div className="quality-badge">{qualityBadge}</div>
              )}

              {/* Move notation */}
              <div className="move-text">{moveData.move}</div>

              {/* Wager amount */}
              <div className="wager-amount">{totalWagered}</div>

              {/* Hold progress indicator */}
              {isCurrentlyHolding && (
                <div className="hold-progress">
                  <div 
                    className="progress-ring" 
                    style={{ 
                      background: `conic-gradient(#00EFB2 ${holdProgress * 3.6}deg, transparent 0deg)` 
                    }}
                  />
                </div>
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