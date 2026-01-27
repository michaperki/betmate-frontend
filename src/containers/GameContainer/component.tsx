import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Config } from 'chessground/config';
import { Api } from 'chessground/api';
import { Chess } from 'chess.js';
import { Key } from 'chessground/types';

import Chessboard from 'components/Chessboard';
import Header from 'components/Header';
import PlayerHeader from 'components/PlayerHeader';
import MovePredictions from 'components/MovePredictions';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import { MoveOption } from 'components/MovePredictions/component';
import BettingPanel from 'components/BettingPanel';
import DrawOutcomeCard from 'components/DrawOutcomeCard';
import { BetItem } from 'components/BettingPanel/component';
import MoveConfirmChip from 'components/MoveConfirmChip';

// Redux actions
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById, fetchGameStats } from 'store/actionCreators/gameActionCreators';
import { createWager, fetchActiveWagers, fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import { getTopMoves, getMoveAnalysis } from 'store/requests/analysisRequests';
import { getFeaturedMatch } from 'store/requests/matchesRequests';
import { moveScoreCache } from 'utils/moveScoreCache';

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

const GameContainer: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const dispatch = useDispatch();
  const { mode, limits } = useMode();
  const { screenWidth } = useResponsiveLayout();
  const isCompact = screenWidth <= 900;
  const ultraCompact = screenWidth <= 400;

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
  // Drag-to-bet proposal state
  const [proposal, setProposal] = useState<null | { from: string; to: string; san: string }>(null);
  const [proposalScore, setProposalScore] = useState<number | null>(null);
  const [proposalLoading, setProposalLoading] = useState<boolean>(false);

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
  
  // Generate chessground config (interactive for drag-to-bet)
  const chessboardConfig: Config = useMemo(() => ({
    fen: currentFen as any,
    lastMove,
    orientation: 'white',
    viewOnly: false,
    animation: { enabled: true, duration: 250 } as any,
    highlight: { lastMove: true, check: true } as any,
    draggable: { showGhost: true } as any,
    movable: { free: true, color: 'both', rookCastle: true } as any,
    drawable: {
      enabled: true,
      visible: true,
      autoShapes: hoverArrow ? [{ orig: hoverArrow[0] as Key, dest: hoverArrow[1] as Key, brush: 'green' }] : [],
    },
    coordinates: true,
    events: {
      move: (orig: string, dest: string) => {
        try {
          const chess = new Chess(currentFen);
          const m = (chess.move({ from: orig as any, to: dest as any, promotion: 'q' } as any) as any) || (chess.move(`${orig}${dest}`, { sloppy: true } as any) as any);
          if (!m) return;
          const san = String(m.san || '');
          setHoverArrow([orig, dest]);
          setProposal({ from: orig, to: dest, san });
          setProposalScore(null);
          setProposalLoading(true);
          // First check if this score is already in our cache
          const cachedScore = moveScoreCache.get(currentFen, san);
          if (cachedScore !== null) {
            setProposalScore(cachedScore);
            setProposalLoading(false);
          } else {
            getMoveAnalysis(currentFen, san)
              .then((resp) => {
                // Backend returns { message, data } where data = MoveAnalysis
                const payload = (resp as any)?.data;
                const moveData = (payload && typeof payload === 'object' && 'data' in payload) ? (payload as any).data : payload;
                const val = Number(moveData?.percentile ?? moveData?.score ?? 0);
                const score = Number.isFinite(val) ? val : 0;

                // Store the score in cache for future UI consistency
                if (score > 0) {
                  moveScoreCache.set(currentFen, san, score);
                }

                setProposalScore(score);
              })
              .catch(() => setProposalScore(null))
              .finally(() => setProposalLoading(false));
          }
        } catch {}
      },
    } as any,
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
        // Slightly loosened filter: percentile >= 60, up to 8 moves; fallback to top 8 by score
        const sorted = arr.slice().sort((a: any, b: any) => (Number(b.percentile || b.score || 0)) - (Number(a.percentile || a.score || 0)));
        const filtered = sorted.filter((it: any) => Number(it.percentile || 0) >= 60).slice(0, 8);
        const chosen = (filtered.length > 0 ? filtered : sorted.slice(0, 8));
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

  // Hydrate default stake from Settings (localStorage)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('betmate.newSettings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.defaultStake === 'number' && parsed.defaultStake > 0) {
          setStake(parsed.defaultStake);
        }
      }
    } catch {}
  }, []);
  
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

  // Confirm a proposed drag move using default stake
  const handleConfirmProposal = useCallback(() => {
    if (!proposal || !isAuthenticated || gameState !== 'live') return;
    try {
      const odds = 2.0; // server will compute final odds for arcade move bets
      const moveNumber = Array.isArray(game?.move_hist) ? (game!.move_hist.length + 1) : 1;
      dispatch(createWager(
        targetGameId || id,
        proposal.san,
        stake,
        false,
        odds,
        moveNumber,
        mode,
        mode === 'real' ? 'USDT' : 'BET',
      ));
    } catch (err) {
      console.error('Error dispatching drag wager:', err);
    }
    // Clear overlay and arrow
    setProposal(null);
    setHoverArrow(null);
  }, [dispatch, id, isAuthenticated, gameState, proposal, stake, mode, targetGameId, game?.move_hist]);

  const handleCancelProposal = useCallback(() => {
    setProposal(null);
    setHoverArrow(null);
  }, []);
  
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
    <div className={`new-game-page mode-${mode}`}>
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgb(var(--mode-accent-rgb) / 0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)' }} />

      <Header active="Markets" />

      <main className="new-game-main">
        <div className={`new-game-container new-game-container--${gameState}`}>
          {/* Suppress inline error toast/banner to avoid layout shifts; toasts handled globally */}

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
            compact={isCompact}
            ultraCompact={ultraCompact}
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
          
          <Chessboard
            ref={boardRef}
            config={chessboardConfig}
            gameStatus={gameState}
            winner={gameState === 'ended' ? (viewModel?.winner || undefined) : undefined}
            endType={gameState === 'ended' ? (viewModel?.endType || '') : ''}
            onRestart={resetDemo}
            onReview={() => {}}
          />
          {proposal && (
            <MoveConfirmChip
              parentRef={boardRef as any}
              destSquare={proposal.to}
              score={proposalScore}
              loading={proposalLoading}
              onConfirm={handleConfirmProposal}
              onCancel={handleCancelProposal}
            />
          )}
          
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
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: 8 }}>Position Eval</div>
            {(() => {
              const clamp01 = (v: number) => Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
              let pWhite = clamp01(Number((game as any)?.odds?.white_win ?? 0));
              let pDraw  = clamp01(Number((game as any)?.odds?.draw ?? 0));
              let pBlack = clamp01(Number((game as any)?.odds?.black_win ?? 0));
              let sum = pWhite + pDraw + pBlack;
              if (!(sum > 0)) { pWhite = 0.33; pDraw = 0.34; pBlack = 0.33; sum = 1; }
              else { pWhite /= sum; pDraw /= sum; pBlack /= sum; }
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
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                    <div style={{ width: `${blackPct}%`, background: 'rgba(0,0,0,0.6)' }} />
                    <div style={{ width: `${drawPct}%`, background: 'var(--warning)' }} />
                    <div style={{ width: `${whitePct}%`, background: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
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
              disabledReason={!isAuthenticated ? 'Sign in to bet' : (gameState !== 'live' ? 'Betting disabled — game not live' : undefined)}
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

export default GameContainer;
