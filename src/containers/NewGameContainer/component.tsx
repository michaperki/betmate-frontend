import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Config } from 'chessground/config';
import { Api } from 'chessground/api';
import { Chess } from 'chess.js';
import { Key } from 'chessground/types';

import NewChessboard from 'components/NewChessboard';
import MockHeader from 'experimental/MockHeader';
import PlayerHeader from 'components/PlayerHeader';
import MovePredictions from 'components/MovePredictions';
import { MoveOption } from 'components/MovePredictions/component';
import BettingPanel from 'components/BettingPanel';
import DrawOutcomeCard from 'experimental/DrawOutcomeCard';
import { BetItem } from 'components/BettingPanel/component';

// Redux actions
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById, fetchGameStats } from 'store/actionCreators/gameActionCreators';
import { createWager, fetchActiveWagers, fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import { getTopMoves } from 'store/requests/analysisRequests';
import { getFeaturedMatch } from 'store/requests/matchesRequests';

// Utilities
import { computeArcadeMoveOdds } from 'utils/pricing';
import { realWdlMultiplier } from 'utils/realOdds';
import { toFenFromMoves, toGameViewModel } from 'adapters/game';
import { FALLBACK_TOP_MOVES } from '__fixtures__/analysis';
import { useMode } from 'context/ModeContext';
import { RootState } from 'types/state';
import { Game } from 'types/resources/game';
import { shortWagerReason } from 'utils/wagerErrorText';

import './style.scss';

interface RouteParams {
  id: string;
}

const NewGameContainer: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const dispatch = useDispatch();
  const { mode, limits } = useMode();
  
  // Game state
  const [gameState, setGameState] = useState<'live' | 'ending' | 'ended'>('live');
  const [showSummary, setShowSummary] = useState(false);
  const [betsResolved, setBetsResolved] = useState(false);

  // Chessground board instance reference
  const chessgroundRef = useRef<Api | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  
  // Track featured/live game id when following featured
  const [liveGameId, setLiveGameId] = useState<string>('');
  const followFeatured = !id || id === 'featured';
  const targetGameId = followFeatured ? (liveGameId || '') : id;

  // Redux state selectors
  const game: Game | undefined = useSelector((s: RootState) => (targetGameId ? s.game.games[targetGameId] : undefined));
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const authUser = useSelector((s: RootState) => s.auth.user);
  const cashBalance = useSelector((s: RootState) => s.auth.user?.cash_balance || 0);
  const tokenBalance = useSelector((s: RootState) => s.auth.user?.token_balance || 0);
  const viewerCount = useSelector((s: RootState) => (targetGameId ? s.game.gameStats?.[targetGameId]?.viewerCount : undefined));
  
  // Betting state
  const [whiteBetStatus, setWhiteBetStatus] = useState<'idle' | 'loading' | 'confirmed' | 'rejected'>('idle');
  const [blackBetStatus, setBlackBetStatus] = useState<'idle' | 'loading' | 'confirmed' | 'rejected'>('idle');
  const [whiteBetError, setWhiteBetError] = useState('');
  const [blackBetError, setBlackBetError] = useState('');
  const [moveOptions, setMoveOptions] = useState<MoveOption[]>([]);
  const [pendingMoveIndex, setPendingMoveIndex] = useState<number | null>(null);
  const [hoverArrow, setHoverArrow] = useState<[string, string] | null>(null);
  const [predictionsLoading, setPredictionsLoading] = useState<boolean>(false);

  // Global wager error banner and last attempted action
  const wagerError = useSelector((s: RootState) => s.wager.error);
  const wagerErrorCode = useSelector((s: RootState) => s.wager.errorCode);
  const errorBanner = useMemo(() => {
    if (!wagerError) return '';
    const msg = shortWagerReason(wagerErrorCode ?? null) || wagerError;
    return String(msg);
  }, [wagerError, wagerErrorCode]);
  const [lastAction, setLastAction] = useState<
    null | { type: 'move'; index: number } | { type: 'white' } | { type: 'black' }
  >(null);
  
  // Real wagers from Redux mapped to UI bet items
  const activeWagers = useSelector((s: RootState) => s.wager.activeWagers);
  const wagerHistory = useSelector((s: RootState) => s.wager.wagerHistory);
  const wagersDict = useSelector((s: RootState) => s.wager.wagers);
  const userBets: BetItem[] = useMemo(() => {
    const mapOne = (w: any): BetItem | null => {
      if (!w || (targetGameId && w.game_id !== targetGameId)) return null;
      const type = w.wdl ? String(w.data || '') : String(w.data || '');
      const status = String(w.status || '').toLowerCase();
      const resolved = !!w.resolved;
      const result: BetItem['result'] = resolved
        ? (status === 'won') ? 'won'
          : (status === 'lost') ? 'lost'
          : (status === 'cancelled') ? 'cancelled'
          : 'pending'
        : 'pending';
      const profit = result === 'won' ? (Number(w.amount) * Number(w.odds) - Number(w.amount))
        : result === 'lost' ? (-Number(w.amount))
        : result === 'cancelled' ? 0
        : undefined;
      return {
        id: String(w._id || `${w.game_id}-${w.data}-${w.move_number}`),
        type: type || (w.wdl ? 'wdl' : 'move'),
        odds: Number(w.odds || 2.0),
        stake: Number(w.amount || 0),
        result: result as any,
        profit: typeof profit === 'number' ? profit : undefined,
      };
    };
    const dictArr = Object.values(wagersDict || {});
    const merged = [...(activeWagers || []), ...(wagerHistory || []), ...dictArr]
      .map(mapOne)
      .filter(Boolean) as BetItem[];
    // De-duplicate by id
    const byId = new Map<string, BetItem>();
    for (const it of merged) {
      const prev = byId.get(it.id);
      // Prefer resolved state over pending when merging from multiple sources
      if (!prev) byId.set(it.id, it);
      else {
        const rank = (b: BetItem) => (b.result === 'won' || b.result === 'lost') ? 2 : (b.result === 'pending' ? 0 : 1);
        byId.set(it.id, rank(it) >= rank(prev) ? it : prev);
      }
    }
    return Array.from(byId.values());
  }, [activeWagers, wagerHistory, wagersDict, targetGameId]);
  
  // Default stake amount
  const [stake, setStake] = useState(2);
  
  // Join the game when component mounts
  useEffect(() => {
    // If following featured, poll for the current match id
    if (followFeatured) {
      let mounted = true;
      const pollFeatured = async () => {
        try {
          const resp = await getFeaturedMatch();
          const nextId = String(resp?.data?.match_id || '');
          if (mounted && nextId && nextId !== liveGameId) {
            try { if (liveGameId) dispatch(leaveGame(liveGameId)); } catch {}
            setLiveGameId(nextId);
          }
        } catch {}
      };
      pollFeatured();
      const t = window.setInterval(pollFeatured, 10000);
      return () => { mounted = false; window.clearInterval(t); };
    }
  }, [dispatch, followFeatured, liveGameId]);

  // Join/leave and fetch for target game id
  useEffect(() => {
    if (!targetGameId) return;
    dispatch(fetchGameById(targetGameId));
    dispatch(joinGame(targetGameId));
    // Poll game stats every 5s
    const statsInterval = window.setInterval(() => {
      dispatch(fetchGameStats(targetGameId));
    }, 5000);
    return () => {
      dispatch(leaveGame(targetGameId));
      window.clearInterval(statsInterval);
    };
  }, [dispatch, targetGameId]);
  
  // Fetch wagers periodically to hydrate BettingPanel
  useEffect(() => {
    const t = window.setInterval(() => {
      try { dispatch(fetchActiveWagers()); } catch {}
      try { dispatch(fetchWagerHistory()); } catch {}
    }, 5000);
    return () => window.clearInterval(t);
  }, [dispatch]);
  
  // Format display time from seconds
  const formatDisplayTime = useCallback((seconds: number): string => {
    if (seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Build a view model for simplified consumption
  const viewModel = useMemo(() => (game ? toGameViewModel(game) : undefined), [game]);

  // Current position: prefer server-provided FEN, fallback to local reconstruction
  const currentFen = useMemo(() => {
    const serverFen = game?.state && String(game.state).trim();
    if (serverFen) return serverFen;
    return toFenFromMoves(game?.move_hist as any);
  }, [game?.state, game?.move_hist]);

  // Parse time from game state via view model
  const [displayWhite, setDisplayWhite] = useState<number>(0);
  const [displayBlack, setDisplayBlack] = useState<number>(0);
  const timeWhite = displayWhite;
  const timeBlack = displayBlack;

  // Determine which player's turn it is from current FEN when possible
  const isWhiteTurn = useMemo(() => {
    try {
      if (currentFen) {
        return new Chess(currentFen).turn() === 'w';
      }
    } catch {}
    return viewModel?.isWhiteTurn ?? true;
  }, [currentFen, viewModel?.isWhiteTurn]);

  // Initialize display clocks when values change
  useEffect(() => {
    if (!viewModel) return;
    setDisplayWhite(Math.max(0, Math.floor(viewModel.timeWhiteSec)));
    setDisplayBlack(Math.max(0, Math.floor(viewModel.timeBlackSec)));
  }, [viewModel?.timeWhiteSec, viewModel?.timeBlackSec]);

  // Tick active side every second when live
  useEffect(() => {
    if (!game || game.complete) return;
    if (gameState !== 'live') return;
    const iv = window.setInterval(() => {
      if (isWhiteTurn) {
        setDisplayWhite((s) => Math.max(0, s - 1));
      } else {
        setDisplayBlack((s) => Math.max(0, s - 1));
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [game?.complete, gameState, isWhiteTurn]);
  
  // Check if time is low (< 30 seconds)
  const isWhiteTimeLow = timeWhite < 30;
  const isBlackTimeLow = timeBlack < 30;
  
  

  // Compute last move to enable highlight animation
  const lastMove = useMemo(() => {
    try {
      const hist = (game?.move_hist || []) as any[];
      if (hist.length === 0) return undefined;
      const mv = hist[hist.length - 1];
      if (mv?.from && mv?.to) return [mv.from as Key, mv.to as Key] as [Key, Key];
    } catch {}
    return undefined;
  }, [game?.move_hist]);
  
  // Generate chessground config
  const chessboardConfig: Config = useMemo(() => ({
    fen: currentFen as any,
    lastMove,
    orientation: 'white',
    viewOnly: true,
    animation: { enabled: true, duration: 250 } as any,
    highlight: { lastMove: true, check: true } as any,
    draggable: { showGhost: true } as any,
    movable: { free: false, color: 'both', rookCastle: true } as any,
    drawable: {
      enabled: true,
      visible: true,
      autoShapes: hoverArrow ? [{ orig: hoverArrow[0] as Key, dest: hoverArrow[1] as Key, brush: 'green' }] : [],
    },
    coordinates: true,
  }), [currentFen, lastMove, hoverArrow]);
  
  // Fetch move predictions
  useEffect(() => {
    const fetchTopMoves = async () => {
      if (!currentFen) return;

      try {
        setPredictionsLoading(true);
        const atMove = Array.isArray(game?.move_hist) ? game!.move_hist.length : undefined;
        const response = await getTopMoves(currentFen, 12, { gameId: targetGameId || id, atMove });
        const arr = Array.isArray(response?.data) ? response.data : [];
        // Sensible limitation: top 6 by percentile (>=70), fallback to top 6 by score
        const sorted = arr.slice().sort((a: any, b: any) => (Number(b.percentile || b.score || 0)) - (Number(a.percentile || a.score || 0)));
        const filtered = sorted.filter((it: any) => Number(it.percentile || 0) >= 70).slice(0, 6);
        const chosen = (filtered.length > 0 ? filtered : sorted.slice(0, 6));
        const topMoves = chosen.map((item: any) => ({ move: String(item.move), score: Number(item.percentile ?? item.score ?? 0) }));
        const moveNames = topMoves.map((m: any) => m.move);
        const oddsMap = (typeof limits?.arcadeMoveMargin === 'number')
          ? computeArcadeMoveOdds(moveNames, topMoves, limits!.arcadeMoveMargin as number)
          : computeArcadeMoveOdds(moveNames, topMoves);
        const formattedMoves = topMoves.map(m => ({
          move: m.move,
          score: Math.round(Number(m.score || 0)),
          odds: oddsMap[m.move] || 2.0,
          status: 'idle' as const,
        }));

        setMoveOptions(formattedMoves);
        setPredictionsLoading(false);
      } catch (err) {
        console.error('Error fetching top moves:', err);
        // Fallback to local fixture for a usable UI
        const fallback = FALLBACK_TOP_MOVES.slice(0, 6);
        const moveNames = fallback.map(m => m.move);
        const oddsMap = computeArcadeMoveOdds(moveNames, fallback);
        const formattedMoves = fallback.map(m => ({
          move: m.move,
          score: 0,
          odds: oddsMap[m.move] || 2.0,
          status: 'idle' as const,
        }));
        setMoveOptions(formattedMoves);
        setPredictionsLoading(false);
      }
    };

    fetchTopMoves();
  }, [currentFen, id, targetGameId, game?.move_hist]);
  
  // Handle move hover for arrow display
  const handleMoveHover = useCallback((move: string, index: number) => {
    try {
      const chess = new Chess(currentFen);
      const moveObj = chess.move(move, { sloppy: true } as any);
      if (moveObj) {
        setHoverArrow([moveObj.from, moveObj.to]);
      }
    } catch (err) {
      console.warn('Error parsing move for hover:', err);
    }
  }, [currentFen]);
  
  const handleMoveHoverEnd = useCallback(() => {
    setHoverArrow(null);
  }, []);
  
  // Place bet on move
  const handleMoveBet = useCallback((move: string, index: number) => {
    if (!isAuthenticated || gameState !== 'live') return;

    // Enforce arcade max stake for move bets when available
    const maxStake = limits?.arcadeMaxStakeMove;
    if (typeof maxStake === 'number' && stake > maxStake) {
      setMoveOptions(prev => prev.map((m, i) => i === index ? { ...m, status: 'disabled', message: `Max ${maxStake}` } : m));
      return;
    }

    setPendingMoveIndex(index);
    setLastAction({ type: 'move', index });

    // Update the UI immediately to show loading state
    setMoveOptions(prev =>
      prev.map((m, i) => i === index ? { ...m, status: 'loading' } : m)
    );

    // Dispatch real wager creation
    try {
      const odds = typeof moveOptions[index]?.odds === 'number' ? moveOptions[index].odds : 2.0;
      const moveNumber = Array.isArray(game?.move_hist) ? (game!.move_hist.length + 1) : 1;
      dispatch(createWager(
        targetGameId || id,
        move,
        stake,
        false,
        odds,
        moveNumber,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      ));
    } catch (err) {
      console.error('Error dispatching wager:', err);
    }

    // Clear pending indicator with a slight delay for UX; real result reconciles via Redux
    setTimeout(() => setPendingMoveIndex(null), 1000);
  }, [dispatch, id, isAuthenticated, gameState, stake, moveOptions, mode, limits?.arcadeMaxStakeMove, targetGameId]);
  
  // Handle bet on white win
  const handleWhiteBet = useCallback(() => {
    if (!isAuthenticated || gameState !== 'live') return;

    setWhiteBetStatus('loading');
    setLastAction({ type: 'white' });

    // Enforce arcade max stake for WDL bets when available
    const maxStake = limits?.arcadeMaxStakeWdl;
    if (typeof maxStake === 'number' && stake > maxStake) {
      setWhiteBetStatus('rejected');
      setWhiteBetError(`Max ${maxStake}`);
      return;
    }

    // Dispatch real wager creation (WDL: white)
    try {
      const moveNumber = Array.isArray(game?.move_hist) ? game!.move_hist.length : 0;
      // Backend expects odds >= 1; game.odds holds probabilities (0..1)
      const p = Number(game?.odds?.white_win || 0);
      const odds = p > 0 ? realWdlMultiplier('white_win', p, moveNumber) : 2.0;
      dispatch(createWager(
        targetGameId || id,
        'white_win',
        stake,
        true,
        odds,
        moveNumber,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      ));
    } catch (err) {
      console.error('Error dispatching wager:', err);
    }

    // Brief confirmed state for UX; real updates reconcile via Redux
    setTimeout(() => setWhiteBetStatus('confirmed'), 250);
    setTimeout(() => setWhiteBetStatus('idle'), 1500);
  }, [dispatch, id, isAuthenticated, gameState, stake, mode, limits?.arcadeMaxStakeWdl, targetGameId]);
  
  // Handle bet on black win
  const handleBlackBet = useCallback(() => {
    if (!isAuthenticated || gameState !== 'live') return;

    setBlackBetStatus('loading');
    setLastAction({ type: 'black' });

    // Enforce arcade max stake for WDL bets when available
    const maxStake = limits?.arcadeMaxStakeWdl;
    if (typeof maxStake === 'number' && stake > maxStake) {
      setBlackBetStatus('rejected');
      setBlackBetError(`Max ${maxStake}`);
      return;
    }

    // Dispatch real wager creation (WDL: black)
    try {
      const moveNumber = Array.isArray(game?.move_hist) ? game!.move_hist.length : 0;
      const p = Number(game?.odds?.black_win || 0);
      const odds = p > 0 ? realWdlMultiplier('black_win', p, moveNumber) : 2.0;
      dispatch(createWager(
        targetGameId || id,
        'black_win',
        stake,
        true,
        odds,
        moveNumber,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      ));
    } catch (err) {
      console.error('Error dispatching wager:', err);
    }

    // Brief confirmed state for UX; real updates reconcile via Redux
    setTimeout(() => setBlackBetStatus('confirmed'), 250);
    setTimeout(() => setBlackBetStatus('idle'), 1500);
  }, [dispatch, id, isAuthenticated, gameState, stake, mode, limits?.arcadeMaxStakeWdl, targetGameId]);

  // Unified outcome bet handler (white/draw/black)
  const handleOutcomeBet = useCallback((outcome: 'white_win'|'draw'|'black_win', customStake?: number) => {
    if (!isAuthenticated || gameState !== 'live') return;
    const s = typeof customStake === 'number' ? customStake : stake;
    // Enforce WDL max stake when available
    const maxStake = limits?.arcadeMaxStakeWdl;
    if (typeof maxStake === 'number' && s > maxStake) return;
    try {
      const moveNumber = Array.isArray(game?.move_hist) ? game!.move_hist.length : 0;
      const p = Number((game as any)?.odds?.[outcome.replace('_win','') as 'white'|'black'|'draw'] || (outcome === 'white_win' ? (game as any)?.odds?.white_win : outcome === 'black_win' ? (game as any)?.odds?.black_win : (game as any)?.odds?.draw) || 0);
      const odds = p > 0 ? realWdlMultiplier(outcome as any, p, moveNumber) : 2.0;
      dispatch(createWager(
        targetGameId || id,
        outcome,
        s,
        true,
        odds,
        moveNumber,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      ));
    } catch (err) {
      console.error('Error dispatching outcome wager:', err);
    }
  }, [dispatch, id, isAuthenticated, gameState, stake, mode, limits?.arcadeMaxStakeWdl, targetGameId, game?.move_hist, (game as any)?.odds]);

  // Apply inline error feedback when wager creation fails
  useEffect(() => {
    if (!wagerError) return;
    const msg = shortWagerReason(wagerErrorCode ?? null) || 'Bet rejected';
    if (lastAction?.type === 'white') {
      setWhiteBetStatus('rejected');
      setWhiteBetError(String(msg));
    } else if (lastAction?.type === 'black') {
      setBlackBetStatus('rejected');
      setBlackBetError(String(msg));
    } else if (lastAction?.type === 'move' && typeof lastAction.index === 'number') {
      setMoveOptions(prev => prev.map((m, i) => i === lastAction.index ? { ...m, status: 'disabled', message: String(msg) } : m));
    }
  }, [wagerError, wagerErrorCode]);
  
  // Detect when game is complete and update state
  useEffect(() => {
    if (game?.complete && gameState === 'live') {
      setGameState('ending');
      setTimeout(() => {
        setGameState('ended');
        setTimeout(() => setBetsResolved(true), 600);
        setTimeout(() => setShowSummary(true), 1800);
      }, 500);
    }
  }, [game?.complete, gameState]);
  
  // Bets resolve via Redux; no local simulation needed
  
  // For demo/development, allow simulating game end
  const simulateGameEnd = () => {
    setGameState('ending');
    setTimeout(() => {
      setGameState('ended');
      setTimeout(() => setBetsResolved(true), 600);
      setTimeout(() => setShowSummary(true), 1800);
    }, 500);
  };
  
  const resetDemo = () => {
    setGameState('live');
    setShowSummary(false);
    setBetsResolved(false);
  };

  return (
    <div className="new-game-page">
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />

      <MockHeader active="Markets" />

      <main style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div className={`new-game-container new-game-container--${gameState}`}>
          {errorBanner && (
            <div className="new-game-container__error">
              {errorBanner}
            </div>
          )}

          <div className="new-game-container__content">
        {/* Left column - Move Predictions */}
        <div className="new-game-container__predictions" data-tour-id="move-tiles">
          <MovePredictions 
            moves={moveOptions}
            loading={predictionsLoading}
            gameEnded={gameState !== 'live'}
            onMoveClick={isAuthenticated ? handleMoveBet : undefined}
            onMoveHover={handleMoveHover}
            onMoveHoverEnd={handleMoveHoverEnd}
          />
        </div>
        
        {/* Center column - Chessboard and player headers */}
        <div className="new-game-container__board-wrapper" data-tour-id="player-header">
          <PlayerHeader
            side="black"
            name={viewModel?.playerBlack.name || 'Black'}
            rating={viewModel?.playerBlack.elo || 0}
            time={formatDisplayTime(timeBlack)}
            isActive={!isWhiteTurn}
            lowTime={isBlackTimeLow}
            onOutcomeClick={isAuthenticated ? handleBlackBet : undefined}
            status={blackBetStatus}
            statusMessage={blackBetError}
          />
          
          <NewChessboard
            ref={boardRef}
            config={chessboardConfig}
            gameStatus={gameState}
            winner={gameState === 'ended' ? (viewModel?.winner || undefined) : undefined}
            endType={gameState === 'ended' ? (viewModel?.endType || '') : ''}
            onRestart={resetDemo}
            onReview={() => {}}
          />
          
          <PlayerHeader
            side="white"
            name={viewModel?.playerWhite.name || 'White'}
            rating={viewModel?.playerWhite.elo || 0}
            time={formatDisplayTime(timeWhite)}
            isActive={isWhiteTurn}
            lowTime={isWhiteTimeLow}
            onOutcomeClick={isAuthenticated ? handleWhiteBet : undefined}
            status={whiteBetStatus}
            statusMessage={whiteBetError}
            isWinner={false}
          />
          
          {/* No draw button under board per mock — draw goes in right panel */}
        </div>
        
        {/* Right column - Betting panel */}
        <div className="new-game-container__betting" data-tour-id="receipts">
          {/* Position Eval first */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 8 }}>Position Eval</div>
            {(() => {
              let pWhite = Number((game as any)?.odds?.white_win ?? 0.33);
              let pDraw  = Number((game as any)?.odds?.draw ?? 0.34);
              let pBlack = Number((game as any)?.odds?.black_win ?? 0.33);
              const sum = pWhite + pDraw + pBlack;
              if (sum > 0) { pWhite /= sum; pDraw /= sum; pBlack /= sum; }
              if (gameState === 'ended') {
                const w = (viewModel?.winner || '').toLowerCase();
                pWhite = w === 'white' ? 1 : 0;
                pDraw = w === 'draw' ? 1 : 0;
                pBlack = w === 'black' ? 1 : 0;
              }
              const whitePct = Math.round(pWhite * 100);
              const drawPct  = Math.round(pDraw * 100);
              const blackPct = Math.round(pBlack * 100);
              return (
                <>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ width: `${blackPct}%`, background: '#1a1a24' }} />
                    <div style={{ width: `${drawPct}%`, background: '#6b7280' }} />
                    <div style={{ width: `${whitePct}%`, background: '#e8e8e8' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, opacity: 0.6 }}>
                    <span>Black {blackPct}%</span>
                    <span>White {whitePct}%</span>
                  </div>
                </>
              );
            })()}
          </div>
          {/* Outcome selector second */}
          <div style={{ marginBottom: 16 }}>
            <DrawOutcomeCard
              disabled={!isAuthenticated || gameState !== 'live'}
              odds={game?.odds as any}
              onPlace={(o, s) => handleOutcomeBet(o, s)}
            />
          </div>
          {/* Receipts last */}
          <BettingPanel
            bets={userBets}
            currency={mode === 'real' ? 'USDT' : 'KBITZ'}
            gameEnded={gameState === 'ended'}
            showSummary={showSummary}
          />
        </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewGameContainer;
