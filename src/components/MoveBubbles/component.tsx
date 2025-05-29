import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ROOT_URL } from 'utils';
import './style.scss';

interface MoveData {
  move: string;
  score: number;
  percentile: number;
  is_best_move: boolean;
  loading?: boolean; // Optional flag to indicate loading state
  transitioning?: boolean; // Optional flag to indicate transition from loading to analyzed
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
  userSubmittedMoves?: Set<string>;
  userInteractedMoves?: Set<string>;
}

const MoveBubbles: React.FC<MoveBubblesProps> = function MoveBubbles(props) {
  const {
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
    userSubmittedMoves,
    userInteractedMoves,
  } = props;

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
  
  // State for storing move analysis results
  const [userMoveAnalysis, setUserMoveAnalysis] = useState<Record<string, MoveData>>({});

  const HOLD_DURATION = 600; // 600ms hold time
  const ANIMATION_DURATION = 300; // 300ms animation duration

  // Fix potential FEN format issues
  const cleanFEN = (fen: string): string => {
    try {
      // Split the FEN into its components
      const fenParts = fen.split(' ');
      if (fenParts.length >= 6) {
        // Check castling rights (field 3)
        let castlingRights = fenParts[2];
        if (castlingRights !== "-" && !/^[KQkq]+$/.test(castlingRights)) {
          fenParts[2] = "-"; // Set to no castling if invalid
        }

        // Check if the en passant target is valid (field 4)
        const enPassantTarget = fenParts[3];
        // A valid en passant target is either "-" or a square like "e3"/"e6"
        if (enPassantTarget !== "-" && !/^[a-h][36]$/.test(enPassantTarget)) {
          fenParts[3] = "-";
        }

        // Check half-move clock (field 5)
        const halfMoveClock = fenParts[4];
        if (!/^\d+$/.test(halfMoveClock)) {
          fenParts[4] = "0"; // Reset to 0 if invalid
        }

        // Check full move number (field 6)
        const fullMoveNumber = fenParts[5];
        if (!/^\d+$/.test(fullMoveNumber)) {
          fenParts[5] = "1"; // Reset to 1 if invalid
        }

        return fenParts.join(' ');
      } else if (fenParts.length < 6) {
        // Add missing parts if needed
        while (fenParts.length < 6) {
          if (fenParts.length === 2) fenParts.push("KQkq"); // Default castling rights
          else if (fenParts.length === 3) fenParts.push("-"); // Default en passant
          else if (fenParts.length === 4) fenParts.push("0"); // Default half-move clock
          else if (fenParts.length === 5) fenParts.push("1"); // Default full move number
        }
        return fenParts.join(' ');
      }
    } catch (e) {
      console.error('Error parsing FEN:', e);
    }
    return fen;
  };

  // Convert a move to its valid SAN notation
  const getSANMove = (fen: string, move: string): string | null => {
    try {
      const chess = new Chess(fen);

      // Remove check/checkmate indicators ('+', '#') for processing
      const moveBase = move.replace(/[+#]$/, '');

      // If it's already a full move like "e2e4", try it directly
      if (moveBase.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(moveBase)) {
        const validMove = chess.move(moveBase, { sloppy: true });
        if (validMove) {
          return validMove.san; // chess.js will add +/# as needed
        }
      }

      // If it's a standard SAN notation like "e4", "Nf3", etc., try it directly
      const validMove = chess.move(moveBase, { sloppy: true });
      if (validMove) {
        chess.undo(); // Undo the move to restore position
        return validMove.san; // chess.js will add +/# as needed
      }

      // If it has the format of origin-destination like "a6c5", try to format it properly
      if (moveBase.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(moveBase)) {
        const from = moveBase.substring(0, 2);
        const to = moveBase.substring(2, 4);

        // Try to make the move using from-to format
        try {
          const moveObj = chess.move({
            from: from as any, // Cast to any to bypass type incompatibility
            to: to as any,     // between string and Square types
            promotion: 'q' // Default to queen promotion
          });

          if (moveObj) {
            const san = moveObj.san;
            chess.undo();
            return san;
          }
        } catch (e) {
          // Invalid move format
        }
      }

      // If it's just a destination square like "d5", find the piece that can move there
      if (/^[a-h][1-8]$/.test(moveBase)) {
        for (const legalMove of chess.moves({ verbose: true })) {
          if (legalMove.to === moveBase) {
            // Use this move's SAN notation
            const testMove = chess.move(legalMove);
            if (testMove) {
              const san = testMove.san;
              chess.undo();
              return san; // chess.js will add +/# as needed
            }
          }
        }
      }

      // Check if it's in the "from-to" notation like "a6-c5"
      const fromToMatch = moveBase.match(/^([a-h][1-8])-([a-h][1-8])$/);
      if (fromToMatch) {
        const [_, from, to] = fromToMatch;

        try {
          const moveObj = chess.move({
            from: from as any, // Cast to any to bypass type incompatibility
            to: to as any,     // between string and Square types
            promotion: 'q' // Default to queen promotion
          });

          if (moveObj) {
            const san = moveObj.san;
            chess.undo();
            return san;
          }
        } catch (e) {
          // Invalid move format
        }
      }

      // Try all legal moves and see if any match when ignoring +/#
      const allLegalSANMoves = chess.moves();
      for (const legalSAN of allLegalSANMoves) {
        if (legalSAN.replace(/[+#]$/, '') === moveBase) {
          return legalSAN; // Return the full SAN with +/# included
        }
      }
    } catch (e) {
      console.error('Error getting SAN notation:', e);
    }

    return null;
  };

  // Animate out old moves when game state changes
  const animateOutAndFetch = async () => {
    if (topMoves.length > 0 && lastGameStateRef.current !== gameState) {
      setAnimatingOut(true);
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
    }

    setIsLoading(true);

    try {
      // Fix potential FEN format issues
      const cleanFen = cleanFEN(gameState);
      
      // Use the backend analysis endpoint for top moves
      const response = await fetch(`${ROOT_URL}/analysis/top-moves?fen=${encodeURIComponent(cleanFen)}&n=6`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      // Parse Lambda response format (data.body contains the actual response)
      let parsedData;
      if (data.body) {
        try {
          parsedData = JSON.parse(data.body);
        } catch (error) {
          parsedData = data;
        }
      } else {
        parsedData = data;
      }

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
        } else {
          setTopMoves([]);
          setAnimatingOut(false);
        }
      } else {
        setTopMoves([]);
        setAnimatingOut(false);
      }
    } catch (error) {
      console.error('Failed to fetch top moves:', error);
      setTopMoves([]);
      setAnimatingOut(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch top moves with animation
  useEffect(() => {
    if (!gameState) {
      return;
    }

    // Add a small delay to avoid race conditions with game state updates
    const timeoutId = setTimeout(animateOutAndFetch, 100);
    return () => clearTimeout(timeoutId);
  }, [gameState]);
  
  // Effect to fetch analysis for user-submitted moves
  useEffect(() => {
    // Only process if we have user-submitted moves
    if (!userSubmittedMoves || userSubmittedMoves.size === 0 || !gameState) return;

    // Create a set of moves needing analysis
    const movesToAnalyze = new Set<string>();

    // Find moves that need analysis and aren't already being analyzed
    userSubmittedMoves.forEach(move => {
      // Skip if move is in AI suggestions or already analyzed
      const alreadyInAISuggestions = topMoves.some(aiMove => aiMove.move === move);
      const alreadyAnalyzed = userMoveAnalysis[move] !== undefined;

      // If needs analysis and not already loading, add to loading state
      if (!alreadyInAISuggestions && !alreadyAnalyzed) {
        movesToAnalyze.add(move);
        // Set loading state for this move
        setUserMoveAnalysis(prev => ({
          ...prev,
          [move]: {
            move,
            score: 0,
            percentile: 0,
            is_best_move: false,
            loading: true // Mark as loading
          }
        }));
      }
    });

    // Process each move that needs analysis
    movesToAnalyze.forEach(async move => {
      try {
        // Fix potential FEN format issues
        const cleanFen = cleanFEN(gameState);

        // Check if the move is in the format {orig: 'a6', dest: 'c5'}
        const origDestMatch = move.match(/^\{orig:\s*['"]([a-h][1-8])['"],\s*dest:\s*['"]([a-h][1-8])['"].*\}$/);
        let moveToUse = move;

        // Check if the move is in UCI format (e.g., "g1f3")
        const uciMatch = move.match(/^([a-h][1-8])([a-h][1-8])$/);

        if (origDestMatch) {
          // Extract and convert to SAN format
          const [_, orig, dest] = origDestMatch;

          // Use chess.js to convert to SAN
          const chess = new Chess(cleanFen);
          try {
            const moveObj = chess.move({
              from: orig as any, // Cast to any to bypass type incompatibility
              to: dest as any,   // between string and Square types
              promotion: 'q'
            });

            if (moveObj) {
              moveToUse = moveObj.san;
            }
          } catch (e) {
            // Failed to convert orig-dest format
          }
        } else if (move.includes('x')) {
          // The microservice accepts "Qxg5" format directly
          moveToUse = move;
        } else {
          // For non-capture moves, try to get SAN notation
          const sanMove = getSANMove(cleanFen, move);
          moveToUse = sanMove || move;
        }

        // Special case handling for rook moves like Rg2
        if (moveToUse.startsWith('R') && moveToUse.length === 3 && /R[a-h][1-8]/.test(moveToUse)) {
          // Try to convert to proper SAN by finding valid moves
          try {
            const chess = new Chess(cleanFen);
            const targetSquare = moveToUse.substring(1);
            
            // Get all legal moves
            const legalMoves = chess.moves();
            
            // Look for rook moves to the target square
            const rookMoves = legalMoves.filter(m => 
              m.startsWith('R') && m.endsWith(targetSquare)
            );
            
            if (rookMoves.length > 0) {
              // Use the first legal rook move to this square
              const properSAN = rookMoves[0];
              moveToUse = properSAN;
            }
          } catch (e) {
            // Error fixing rook move
          }
        }

        // Try to analyze the move first with chess.js to ensure it's valid
        try {
          const chess = new Chess(cleanFen);
          const validMove = chess.move(moveToUse, { sloppy: true });

          if (!validMove) {
            const legalMoves = chess.moves();
            
            // Try to find a similar move in the legal moves
            const similarMoves = legalMoves.filter(m => 
              m.includes(moveToUse.substring(1)) || // Same destination square
              (moveToUse.length >= 2 && m.startsWith(moveToUse.charAt(0)))  // Same piece type
            );
            
            if (similarMoves.length > 0) {
              moveToUse = similarMoves[0]; // Use the first similar move
            }
          } else {
            // Use the SAN notation from chess.js
            moveToUse = validMove.san;
          }
        } catch (e) {
          // Error validating move
        }
        
        const apiUrl = `${ROOT_URL}/analysis/move?fen=${encodeURIComponent(cleanFen)}&move=${encodeURIComponent(moveToUse)}`;

        const response = await fetch(
          apiUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // Handle non-200 responses
        if (!response.ok) {
          // For simple pawn moves like "b6", convert to UCI format (b7b6) and try again
          if (/^[a-h][2-7]$/.test(moveToUse)) {
            const rank = moveToUse.charAt(1);
            const file = moveToUse.charAt(0);
            const fromRank = rank === '6' ? '7' : (rank === '3' ? '2' : parseInt(rank) + (rank < '5' ? -1 : 1));
            const uciMove = `${file}${fromRank}${moveToUse}`;

            // Convert UCI to SAN
            const chess = new Chess(cleanFen);
            try {
              const moveObj = chess.move({
                from: `${file}${fromRank}` as any,
                to: moveToUse as any,
                promotion: 'q'
              });

              if (moveObj) {
                const sanMove = moveObj.san;

                // Try again with SAN notation
                const retryUrl = `${ROOT_URL}/analysis/move?fen=${encodeURIComponent(cleanFen)}&move=${encodeURIComponent(sanMove)}`;
                
                const retryResponse = await fetch(
                  retryUrl,
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  }
                );

                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  if (data && data.message === 'SUCCESS' && data.data) {
                    setUserMoveAnalysis(prev => ({
                      ...prev,
                      [move]: {
                        ...data.data,
                        move: move // Always use original move for display
                      }
                    }));
                    return; // Skip further processing
                  }
                }
              }
            } catch (e) {
              // Failed to convert to SAN
            }
          }

          // Fallback if backend returns error and retry fails
          setUserMoveAnalysis(prev => ({
            ...prev,
            [move]: {
              move,
              score: 0,
              percentile: 40, // Default to "decent" move for rejected moves
              is_best_move: false
            }
          }));
          return; // Skip further processing
        }

        const data = await response.json();

        if (data && data.message === 'SUCCESS' && data.data) {
          // Make sure the move property exists and matches
          let analysisData;

          // Check if we have valid analysis data
          if (data.data.move && typeof data.data.percentile === 'number') {
            analysisData = {
              ...data.data, // Include original data with all its properties
              move: move, // Always use the requested move name to be safe
            };
          } else {
            // Create fallback data if missing key properties
            analysisData = {
              move: move,
              percentile: typeof data.data.percentile === 'number' ? data.data.percentile : 40, // Default to "decent" move
              score: typeof data.data.score === 'number' ? data.data.score : 0,
              is_best_move: !!data.data.is_best_move
            };
          }

          // Store the enhanced move analysis data with a transition flag
          // First update with a transition state
          setUserMoveAnalysis(prev => {
            const prevData = prev[move];
            // Only add transition flag if we're coming from loading state
            const isTransitioning = prevData && prevData.loading;

            return {
              ...prev,
              [move]: {
                ...analysisData,
                transitioning: isTransitioning // Add transitioning flag if coming from loading
              }
            };
          });

          // After a short delay, remove the transition flag
          if (userMoveAnalysis[move]?.loading) {
            setTimeout(() => {
              setUserMoveAnalysis(prev => ({
                ...prev,
                [move]: {
                  ...analysisData,
                  transitioning: false
                }
              }));
            }, 50); // Short delay to trigger CSS transition
          }
        } else {
          // Store fallback values
          // First update with a transition state
          setUserMoveAnalysis(prev => {
            const prevData = prev[move];
            // Only add transition flag if we're coming from loading state
            const isTransitioning = prevData && prevData.loading;

            const fallbackData = {
              move,
              score: 0,
              percentile: 40, // Default to "decent" move
              is_best_move: false,
              transitioning: isTransitioning // Add transitioning flag if coming from loading
            };

            return {
              ...prev,
              [move]: fallbackData
            };
          });

          // After a short delay, remove the transition flag
          if (userMoveAnalysis[move]?.loading) {
            setTimeout(() => {
              setUserMoveAnalysis(prev => ({
                ...prev,
                [move]: {
                  ...prev[move],
                  transitioning: false
                }
              }));
            }, 50); // Short delay to trigger CSS transition
          }
        }
      } catch (error) {
        console.error('Failed to fetch move analysis:', error);
        // Store fallback values on error
        // First update with a transition state
        setUserMoveAnalysis(prev => {
          const prevData = prev[move];
          // Only add transition flag if we're coming from loading state
          const isTransitioning = prevData && prevData.loading;

          const fallbackData = {
            move,
            score: 0,
            percentile: 40, // Default to "decent" move
            is_best_move: false,
            transitioning: isTransitioning // Add transitioning flag if coming from loading
          };

          return {
            ...prev,
            [move]: fallbackData
          };
        });

        // After a short delay, remove the transition flag
        if (userMoveAnalysis[move]?.loading) {
          setTimeout(() => {
            setUserMoveAnalysis(prev => ({
              ...prev,
              [move]: {
                ...prev[move],
                transitioning: false
              }
            }));
          }, 50); // Short delay to trigger CSS transition
        }
      }
    });
  }, [userSubmittedMoves, gameState, topMoves, userMoveAnalysis]);

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
      // Check if it's already in the format {orig: 'a6', dest: 'c5'}
      const origDestMatch = move.match(/^\{orig:\s*['"]([a-h][1-8])['"],\s*dest:\s*['"]([a-h][1-8])['"].*\}$/);
      if (origDestMatch) {
        const [_, orig, dest] = origDestMatch;
        onMoveHover([{ orig, dest }]);
        return;
      }

      // Remove check/checkmate indicators ('+', '#') for processing
      const moveBase = move.replace(/[+#]$/, '');

      // If it's a destination-only move, find the piece that can move there
      let moveObj;

      if (/^[a-h][1-8]$/.test(moveBase)) {
        // This is just a destination square, look for a piece that can move there
        for (const legalMove of chess.moves({ verbose: true })) {
          if (legalMove.to === moveBase) {
            // Found a valid move
            moveObj = legalMove;
            break;
          }
        }
      } else {
        // Try to execute the move directly
        moveObj = chess.move(moveBase, { sloppy: true });
      }

      if (moveObj) {
        onMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
      } else {
        // Check if it's in "from-to" format like "a6-c5"
        const fromToMatch = moveBase.match(/^([a-h][1-8])-([a-h][1-8])$/);
        if (fromToMatch) {
          const [_, from, to] = fromToMatch;
          onMoveHover([{ orig: from, dest: to }]);
          return;
        }

        // If it has the format of origin-destination like "a6c5", try to format it properly
        if (moveBase.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(moveBase)) {
          const from = moveBase.substring(0, 2);
          const to = moveBase.substring(2, 4);
          onMoveHover([{ orig: from, dest: to }]);
          return;
        }

        // Try one more approach - compare against all legal moves
        const allLegalMoves = chess.moves({ verbose: true });
        for (const legalMove of allLegalMoves) {
          // Compare move names - legalMove.san already contains the SAN notation
          if (legalMove.san && legalMove.san.replace(/[+#]$/, '') === moveBase) {
            onMoveHover([{ orig: legalMove.from, dest: legalMove.to }]);
            break;
          }
        }
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
    const { percentile, is_best_move, loading } = moveData;

    // Special case for loading state
    if (loading) {
      return 'loading-move';
    }

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

  // Create user-submitted move data for moves not already in AI suggestions
  const userMoveData: MoveData[] = [];
  if (userSubmittedMoves) {
    userSubmittedMoves.forEach(move => {
      // Only add if not already in AI suggestions
      const alreadyExists = topMoves.some(aiMove => aiMove.move === move);
      if (!alreadyExists) {
        // Use analyzed data if available, otherwise mark as loading
        if (userMoveAnalysis[move]) {
          // Make sure we're using the analysis data and not showing 50%
          userMoveData.push(userMoveAnalysis[move]);
        } else {
          // Add with special loading flag - no percentile shown while loading
          userMoveData.push({
            move,
            score: 0,
            percentile: 0, // Will be hidden when loading=true
            is_best_move: false,
            loading: true // Special flag to indicate loading state
          });
        }
      }
    });
  }

  // Combine AI moves with user-submitted moves
  const allMoves = [...topMoves, ...userMoveData];

  // Only show loading if we don't have any moves and aren't animating
  if (isLoading && allMoves.length === 0 && !animatingOut) {
    return (
      <div className="move-bubbles-container">
        <div className="move-bubbles-loading">
          <div className="loading-spinner"></div>
          <span>Loading moves...</span>
        </div>
      </div>
    );
  }

  if (allMoves.length === 0) {
    return (
      <div className="move-bubbles-container">
        <div className="no-moves">No moves available</div>
      </div>
    );
  }

  // Determine if we need scrollable layout (more than 5 bubbles)
  const isScrollable = allMoves.length > 5;

  return (
    <div className="move-bubbles-container">
      <div className={`move-bubbles-scroll ${animatingOut ? 'animating-out' : ''} ${isScrollable ? 'scrollable' : ''}`} key={animationKey}>
        {allMoves.map((moveData, index) => {
          const totalWagered = getTotalWagered(moveData.move);
          const qualityBadge = getQualityBadge(moveData);
          const isCurrentMove = hoveredMove === moveData.move;
          const isPendingBet = pendingBet?.isActive && pendingBet.moveString === moveData.move;
          const isCurrentlyHolding = isHolding === moveData.move;
          // Only consider it user-submitted if it's not already in AI suggestions
          const isFromAI = topMoves.some(aiMove => aiMove.move === moveData.move);
          const isUserSubmitted = !isFromAI && (userSubmittedMoves?.has(moveData.move) || false);
          const isUserInteracted = userInteractedMoves?.has(moveData.move) || false;

          return (
            <div
              key={`${moveData.move}-${index}`}
              className={`move-bubble ${getBubbleClass(moveData)} ${getBubbleSize(totalWagered)}
                         ${isCurrentMove ? 'hovered' : ''}
                         ${isPendingBet ? 'pending' : ''}
                         ${isCurrentlyHolding ? 'holding' : ''}
                         ${isAuthenticated ? 'authenticated' : ''}
                         ${isUserSubmitted ? 'user-submitted' : ''}
                         ${isUserInteracted && isFromAI ? 'user-interacted' : ''}
                         ${moveData.transitioning ? 'transitioning' : ''}
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
              {(qualityBadge || isUserSubmitted || moveData.loading) && (
                <div className={`quality-badge ${isUserSubmitted && !moveData.loading ? 'user-badge' : ''} ${moveData.loading ? 'loading-badge' : ''}`}>
                  {moveData.loading ? 'ANALYZING...' : (isUserSubmitted ? 'USER' : qualityBadge)}
                </div>
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

              {/* Percentile score (always visible) */}
              {!moveData.loading && (
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