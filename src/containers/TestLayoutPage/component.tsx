import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import './style.scss';
import ChessgroundWrapper from 'components/ChessgroundWrapper';
import { Config } from 'chessground/config';
import { Key } from 'chessground/types';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTrophy, faWrench } from '@fortawesome/free-solid-svg-icons';
import { useMode } from 'context/ModeContext';
import { tileMotionByVariant, presenceMode } from 'features/moveMenu/moveMenuTransitions';
import { RootState } from 'types/state';
import { Game, Move } from 'types/resources/game';
import { joinGame, leaveGame } from 'store/actionCreators/websocketActionCreators';
import { fetchGameById, fetchGameStats } from 'store/actionCreators/gameActionCreators';
import { fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import { getFeaturedMatch } from 'store/requests/matchesRequests';
import { Chess } from 'chess.js';
import { getTopMoves, type MoveAnalysis } from 'store/requests/analysisRequests';

const TestLayoutPage: React.FC = () => {
  type ClockState = 'idle' | 'ticking';
  type ActiveState = 'inactive' | 'active';
  type ConfirmState = 'idle' | 'loading' | 'confirmed' | 'rejected';

  type HeaderCombo = { clock: ClockState; active: ActiveState; confirm: ConfirmState };
  const combos: HeaderCombo[] = useMemo(() => ([
    { clock: 'idle',    active: 'inactive', confirm: 'idle'      },
    { clock: 'ticking', active: 'active',   confirm: 'loading'   },
    { clock: 'ticking', active: 'active',   confirm: 'confirmed' },
    { clock: 'ticking', active: 'active',   confirm: 'rejected'  },
    { clock: 'idle',    active: 'active',   confirm: 'idle'      },
  ]), []);

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const topState = combos[topIndex % combos.length];
  const bottomState = combos[bottomIndex % combos.length];
  const cycleTop = () => setTopIndex((i) => (i + 1) % combos.length);
  const cycleBottom = () => setBottomIndex((i) => (i + 1) % combos.length);

  // Move Panel Demo — simulate real candidate updates (analysis reorder, add/remove, score tweaks)
  type SimMove = { id: string; label: string; score: number };
  const CANDIDATE_POOL = useMemo(() => (
    ['e4','d4','c4','Nf3','Nc3','g3','b3','f4','Bb5','Bc4','O-O','O-O-O','a4','h3','h4','Qa4','Qf3']
  ), []);
  const [simMoves, setSimMoves] = useState<SimMove[]>(() => (
    ['e4','d4','Nf3','c4'].map((s, i) => ({ id: s, label: s, score: 100 - i * 8 }))
  ));
  const transitionVariant = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'none' as const;
      }
    } catch {}
    return 'morph' as const;
  }, []);
  const motionSpec = useMemo(() => tileMotionByVariant(transitionVariant), [transitionVariant]);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const [leftCols, setLeftCols] = useState(2);
  const [leftTile, setLeftTile] = useState(80);
  type TileStatus = 'idle' | 'active' | 'disabled' | 'loading' | 'success';
  const [tileStates, setTileStates] = useState<TileStatus[]>(() => simMoves.map(() => 'idle'));
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [liveGameId, setLiveGameId] = useState<string>('');
  const dispatch = useDispatch();
  const game: Game | undefined = useSelector((s: RootState) => (liveGameId ? s.game.games[liveGameId] : undefined));
  const allWagersMap = useSelector((s: RootState) => s.wager?.wagers ?? {});
  const fetchedHistory = useSelector((s: RootState) => s.wager?.wagerHistory ?? []);
  const demoSAN = useMemo(() => ['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7'], []);
  const sanList: string[] = useMemo(() => (
    (liveMode && game && Array.isArray(game.move_hist) && game?.move_hist?.length)
      ? (game.move_hist as Move[]).map((m) => String(m.san))
      : demoSAN
  ), [liveMode, game?.move_hist, demoSAN]);
  const [notationCursor, setNotationCursor] = useState<number>(0);
  useEffect(() => { setNotationCursor(Math.max(0, sanList.length - 1)); }, [sanList.length]);
  // Hover arrow state for board overlay
  const [hoverArrow, setHoverArrow] = useState<[string, string] | null>(null);
  const normalizeMoveNotation = useCallback((move: string) => (
    String(move)
      .replace(/^[0-9]+\.{1,3}\s*/, '')
      .replace(/^\.{3}\s*/, '')
      .trim()
  ), []);
  const computeArrowForMove = useCallback((san: string): [string, string] | null => {
    try {
      const fen = (game?.state || undefined);
      const chess = new Chess(fen);
      const mv = chess.move(normalizeMoveNotation(san), { sloppy: true } as any);
      if (mv && mv.from && mv.to) return [String(mv.from), String(mv.to)];
    } catch {}
    return null;
  }, [game?.state, normalizeMoveNotation]);
  const handleMoveHoverStart = useCallback((san: string) => {
    const arrow = computeArrowForMove(san);
    setHoverArrow(arrow ? [arrow[0], arrow[1]] : null);
  }, [computeArrowForMove]);
  const handleMoveHoverEnd = useCallback(() => setHoverArrow(null), []);
  const displayReceipts = useMemo(() => {
    if (!liveMode || !liveGameId) return [] as any[];
    const local = Object.values(allWagersMap) as any[];
    const merged = [...local, ...fetchedHistory];
    const seen: Record<string, boolean> = {};
    const filtered = merged.filter((w) => {
      if (!w || seen[w._id]) return false;
      seen[w._id] = true;
      return String(w.game_id) === String(liveGameId);
    });
    filtered.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return filtered.slice(0, 10);
  }, [allWagersMap, fetchedHistory, liveMode, liveGameId]);

  const nextPosition = useCallback(() => {
    setSimMoves(() => {
      // Pick 4 unique candidates and assign descending scores to simulate a new analysis frame
      const pool = CANDIDATE_POOL.slice();
      const picks: string[] = [];
      while (picks.length < 4 && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(idx, 1)[0]);
      }
      const base = Math.round(70 + Math.random() * 30);
      return picks.map((s, i) => ({
        id: `${s}-${Date.now()}`,
        label: s,
        score: Math.max(10, base - i * (5 + Math.round(Math.random() * 5))),
      }));
    });
  }, [CANDIDATE_POOL]);

  useEffect(() => {
    if (!autoAdvance) return;
    const t = window.setInterval(() => { nextPosition(); }, 6000);
    return () => window.clearInterval(t);
  }, [autoAdvance, nextPosition]);

  // Poll featured match ID and follow it
  useEffect(() => {
    let mounted = true;
    const fetchFeatured = async () => {
      try {
        const resp = await getFeaturedMatch();
        const id = String(resp?.data?.match_id || '');
        if (mounted && id && id !== liveGameId) {
          // Switch to new featured game
          try { if (liveGameId) dispatch(leaveGame(liveGameId)); } catch {}
          setLiveGameId(id);
        }
      } catch {}
    };
    fetchFeatured();
    const t = window.setInterval(fetchFeatured, 10000);
    return () => { mounted = false; window.clearInterval(t); };
  }, [dispatch, liveGameId]);

  // Live mode lifecycle: join/leave current featured game, fetch data
  useEffect(() => {
    if (!liveMode || !liveGameId) return;
    try {
      dispatch(fetchGameById(liveGameId));
      dispatch(fetchGameStats(liveGameId));
    } catch {}
    try { dispatch(joinGame(liveGameId)); } catch {}
    const h = window.setInterval(() => { try { dispatch(fetchWagerHistory(undefined, 10, 0)); } catch {} }, 5000);
    return () => {
      try { dispatch(leaveGame(liveGameId)); } catch {}
      window.clearInterval(h);
    };
  }, [dispatch, liveMode, liveGameId]);
  const cycleTileState = (index: number) => {
    setTileStates((prev) => {
      const next = [...prev];
      const order: TileStatus[] = ['idle', 'active', 'loading', 'success', 'disabled'];
      const cur = prev[index] || 'idle';
      const idx = order.indexOf(cur);
      next[index] = order[(idx + 1) % order.length];
      return next;
    });
  };
  // Simulate stream-like updates (disabled when live is on)
  useEffect(() => {
    if (liveMode) return;
    const t = window.setInterval(() => {
      setSimMoves((prev) => {
        if (!prev.length) return prev;
        const roll = Math.random();
        const next = [...prev];
        if (roll < 0.34) {
          // Reorder subtly via score jitter (like analysis updates)
          const jitter = next.map(m => ({ ...m, score: Math.max(10, Math.round(m.score + (Math.random()*10 - 5))) }));
          jitter.sort((a, b) => b.score - a.score);
          return jitter;
        } else if (roll < 0.67) {
          // Replace a candidate (enter/exit)
          const pool = CANDIDATE_POOL.filter(s => !next.some(n => n.id === s));
          if (pool.length) {
            const idx = Math.floor(Math.random() * next.length);
            const add = pool[Math.floor(Math.random()*pool.length)];
            next.splice(idx, 1, { id: add, label: add, score: Math.round(70 + Math.random()*30) });
            return next;
          }
          return next;
        }
        // Text-only score update
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = { ...next[idx], score: Math.max(10, Math.round(next[idx].score + (Math.random()*12 - 6))) };
        return next;
      });
      // align tile state length
      setTileStates((prev) => Array.from({ length: simMoves.length }, (_, i) => prev[i] || 'idle'));
    }, 1400);
    return () => window.clearInterval(t);
  }, [CANDIDATE_POOL, simMoves.length, liveMode]);

  // Live move tiles: fetch top moves for current FEN
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!liveMode) return;
      const fen = game?.state || '';
      if (!fen) return;
      try {
        const resp = await getTopMoves(fen, 12);
        const arr: MoveAnalysis[] = Array.isArray(resp?.data) ? (resp.data as any) : [];
        const top = arr
          .filter((x) => x && x.move)
          .slice(0, 4)
          .map((x, i) => ({ id: `${String(x.move)}-${sanList.length}`, label: String(x.move), score: Math.round(100 - i * 8) }));
        if (!cancelled && top.length) {
          setSimMoves(top);
          setTileStates((prev) => Array.from({ length: top.length }, (_, i) => prev[i] || 'idle'));
        }
      } catch {}
    };
    run();
    const t = window.setTimeout(run, 350);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [liveMode, game?.state, sanList.length]);

  useEffect(() => {
    if (!leftPanelRef.current) return;
    const gap = 14; // keep in sync with --lp-gap
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      const W = Math.floor(cr.width);
      const H = Math.floor(cr.height);
      if (W <= 0 || H <= 0) return;
      const viewportW = typeof window !== 'undefined' ? window.innerWidth : W;
      // Mobile: force a single row (all columns), compute tile from width only so container shrinks to content
      if (viewportW < 768) {
        const n = simMoves.length;
        const tileW = Math.floor((W - gap * (n - 1)) / n);
        const bestTile = Math.max(0, tileW);
        const breathing = Math.floor(bestTile * 0.88);
        setLeftCols(n);
        setLeftTile(Math.max(32, breathing));
        return;
      }
      // Tablet/Desktop: search best fit
      let bestTile = 0;
      let bestCols = 1;
      for (let c = 1; c <= simMoves.length; c += 1) {
        const rows = Math.ceil(simMoves.length / c);
        const tileW = Math.floor((W - gap * (c - 1)) / c);
        const tileH = Math.floor((H - gap * (rows - 1)) / rows);
        const size = Math.max(0, Math.min(tileW, tileH));
        if (size > bestTile) { bestTile = size; bestCols = c; }
      }
      const breathing = Math.floor(bestTile * 0.92);
      setLeftCols(bestCols);
      setLeftTile(Math.max(40, breathing));
    });
    ro.observe(leftPanelRef.current);
    return () => ro.disconnect();
  }, [simMoves.length]);

  // Build board config with hover arrow overlay
  const boardConfig: Config = useMemo(() => {
    const cfg = buildBoardConfig(game);
    const shapes = hoverArrow ? [{ orig: hoverArrow[0] as Key, dest: hoverArrow[1] as Key, brush: 'green' as any }] : [];
    return {
      ...cfg,
      drawable: {
        enabled: true,
        visible: true,
        defaultSnapToValidMove: true,
        eraseOnClick: false,
        autoShapes: shapes as any,
      } as any,
    } as Config;
  }, [game, hoverArrow]);

  return (
    <div className="test-layout-page">
      <NavBar compact={true} />
      <main className="test-layout-page__content">
        <div className="test-layout-grid">
          <div className="frame frame--left" aria-label="left-panel">
            {(() => {
              const styleVars = { ['--cols' as any]: leftCols, ['--tile' as any]: `${leftTile}px` };
              const list = (
                <AnimatePresence initial={false} mode={presenceMode}>
                  {simMoves.map((m, i) => {
                    const st = tileStates[i] || 'idle';
                    const classes = ['lp-tile', `is-${st}`].join(' ');
                    return (
                      <motion.div
                        layout
                        key={m.id}
                        initial={motionSpec.initial as any}
                        animate={motionSpec.animate as any}
                        exit={motionSpec.exit as any}
                        transition={motionSpec.transition}
                        className={classes}
                        title={`${m.label} (${m.score})`}
                        onClick={() => cycleTileState(i)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleTileState(i); }}
                        aria-busy={st === 'loading'}
                        aria-pressed={st === 'active'}
                        aria-disabled={st === 'disabled'}
                      >
                        <div className="lp-tile__chip" aria-hidden />
                        <div className="lp-tile__spinner" aria-hidden />
                        <div className="lp-tile__check" aria-hidden>✓</div>
                        <div className="lp-tile__text">
                          <span className="lp-name">{m.label}</span>
                          <motion.span
                            className="lp-score"
                            key={`${m.id}-${m.score}`}
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {m.score}
                          </motion.span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              );
              return (
                <div className="left-panel" ref={leftPanelRef} style={styleVars}>
                  {list}
                </div>
              );
            })()}
          </div>
          <div className="frame frame--board" aria-label="board">
            <div className="board-inner">
              <div
                className={[
                  'board-header',
                  'board-header--top',
                  (liveMode && game && (() => { try { const c = new Chess(game.state); return c.turn() === 'b'; } catch { return false; } })()) ? 'is-active' : 'is-inactive',
                ].filter(Boolean).join(' ')}
                onClick={cycleTop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleTop(); }}
                aria-label="Toggle Player 1 header state"
              >
                <div className="ph-left">
                  <div className="ph-name">{liveMode ? (game?.player_black?.name || 'Black') : 'Player 1'}</div>
                  <div className="ph-rating">{liveMode ? (game?.player_black?.elo || '') : '2420'}</div>
                </div>
                <div className="ph-right">
                  <div className="ph-clock">
                    <span>{liveMode ? formatClockSafe(game?.time_black, game?.time_format) : '05:00'}</span>
                    <span className="tick-dot" aria-hidden />
                  </div>
                  <div className="ph-state-chip" aria-hidden />
                </div>
              </div>
              <div className="board-center">
                <div className="board-square">
                  <div className="chessboard-wrapper brown" style={{ width: '100%', height: '100%' }}>
                    <ChessgroundWrapper config={boardConfig} />
                  </div>
                </div>
                <div className="eval-bar"><span className="board__label">Eval</span></div>
              </div>
              <div
                className={[
                  'board-header',
                  'board-header--bottom',
                  (liveMode && game && (() => { try { const c = new Chess(game.state); return c.turn() === 'w'; } catch { return false; } })()) ? 'is-active' : 'is-inactive',
                ].filter(Boolean).join(' ')}
                onClick={cycleBottom}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleBottom(); }}
                aria-label="Toggle Player 2 header state"
              >
                <div className="ph-left">
                  <div className="ph-name">{liveMode ? (game?.player_white?.name || 'White') : 'Player 2'}</div>
                  <div className="ph-rating">{liveMode ? (game?.player_white?.elo || '') : '2510'}</div>
                </div>
                <div className="ph-right">
                  <div className="ph-clock">
                    <span>{liveMode ? formatClockSafe(game?.time_white, game?.time_format) : '04:32'}</span>
                    <span className="tick-dot" aria-hidden />
                  </div>
                  <div className="ph-state-chip" aria-hidden />
                </div>
              </div>
            </div>
          </div>
          <div className="frame frame--right-top" aria-label="right-top">
            {(() => {
              const back = () => setNotationCursor((i) => Math.max(0, i - 1));
              const fwd = () => setNotationCursor((i) => Math.min(sanList.length - 1, i + 1));
              const start = () => setNotationCursor(0);
              const end = () => setNotationCursor(Math.max(0, sanList.length - 1));
              // Build pairs similar to real UI
              const pairs = [] as Array<{ moveNumber: number; white?: string; black?: string }>;
              for (let i = 0; i < sanList.length; i += 2) {
                pairs.push({ moveNumber: Math.floor(i / 2) + 1, white: sanList[i], black: sanList[i + 1] });
              }
              const latestIndex = pairs.length - 1;
              const activePairIndex = Math.max(0, Math.floor(notationCursor / 2));
              return (
                <div className="notation-rail" role="region" aria-label="Notation">
                  <div className="notation-rail__controls">
                    <button className="np-btn" onClick={start} aria-label="Go to start">⏮</button>
                    <button className="np-btn" onClick={back} aria-label="Step back">◀</button>
                    <button className="np-btn" onClick={fwd} aria-label="Step forward">▶</button>
                    <button className="np-btn" onClick={end} aria-label="Go to end">⏭</button>
                    <div className="np-spacer" />
                    <div className="np-status">{sanList.length ? (notationCursor + 1) : 0} / {sanList.length}</div>
                  </div>
                  <div className="notation-rail__list" role="list" onMouseLeave={handleMoveHoverEnd}>
                    {pairs.length ? pairs.map((pair, idx) => {
                      const rowActive = idx === activePairIndex;
                      const rowLatest = idx === latestIndex;
                      const renderCell = (san?: string, color?: 'white' | 'black', cellIndex?: number) => {
                        if (!san) {
                          return (
                            <span className={['notation-row__cell', 'notation-row__cell--placeholder', `notation-row__cell--${color}`].join(' ')} aria-hidden>—</span>
                          );
                        }
                        const isCellActive = cellIndex === notationCursor;
                        return (
                          <button
                            type="button"
                            className={['notation-row__cell', `notation-row__cell--${color}`, isCellActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                            onClick={() => setNotationCursor(cellIndex!)}
                            onMouseEnter={() => handleMoveHoverStart(san)}
                            onFocus={() => handleMoveHoverStart(san)}
                            onMouseLeave={handleMoveHoverEnd}
                            onBlur={handleMoveHoverEnd}
                          >
                            <span className="notation-row__text">{san}</span>
                          </button>
                        );
                      };
                      const whiteIndex = idx * 2;
                      const blackIndex = whiteIndex + 1;
                      return (
                        <div key={`notation-row-${pair.moveNumber}`} className={['notation-row', rowActive ? 'notation-row--active' : '', rowLatest ? 'notation-row--latest' : ''].filter(Boolean).join(' ')}>
                          <span className="notation-row__number">{pair.moveNumber}.</span>
                          {renderCell(pair.white, 'white', whiteIndex)}
                          {renderCell(pair.black, 'black', blackIndex)}
                        </div>
                      );
                    }) : (
                      <div className="notation-row notation-row--empty">
                        <span className="notation-row__number">—</span>
                        <span className="notation-row__cell notation-row__cell--placeholder">Moves will appear here</span>
                        <span className="notation-row__cell notation-row__cell--placeholder" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="frame frame--right-bottom" aria-label="right-bottom">
            {(() => {
              return (
                <div className="receipts-grid" role="table" aria-label="Wager receipts">
                  <div className="rg-head" role="row">
                    <div className="rg-cell rg-col-bet" role="columnheader">Bet</div>
                    <div className="rg-cell rg-col-stake" role="columnheader">Stake</div>
                    <div className="rg-cell rg-col-odds" role="columnheader">Odds</div>
                    <div className="rg-cell rg-col-status" role="columnheader">Status</div>
                  </div>
                  <div className="rg-body">
                    {(liveMode ? displayReceipts : []).map((w) => {
                      const type = w.wdl ? 'outcome' : 'move';
                      const label = w.wdl ? String(w.data) : String(w.data);
                      const oddsText = (() => {
                        if (w.wdl && w.mode === 'real' && w.status === 'won') return `x${(w.odds || 1).toFixed(2)}`;
                        if (!w.wdl && w.mode !== 'real') return `x${(w.odds || 1).toFixed(2)}`;
                        return '—';
                      })();
                      return (
                        <div key={w._id} className={['rg-row', `is-${String(w.status || '').toLowerCase()}`, `type-${type}`].join(' ')} role="row">
                          <div className="rg-cell rg-col-bet" role="cell">
                            <span className={["rg-type-dot", type].join(' ')} aria-hidden />
                            <span className="rg-label" title={label}>{label}</span>
                          </div>
                          <div className="rg-cell rg-col-stake" role="cell">${Math.max(0, w.amount).toFixed(0)}</div>
                          <div className="rg-cell rg-col-odds" role="cell">{oddsText}</div>
                          <div className="rg-cell rg-col-status" role="cell">{String(w.status || 'pending')}</div>
                        </div>
                      );
                    })}
                    {(!liveMode || !displayReceipts.length) && (
                      <div className="rg-row is-empty" role="row">
                        <div className="rg-cell rg-col-bet" role="cell">No wagers</div>
                        <div className="rg-cell rg-col-stake" role="cell">—</div>
                        <div className="rg-cell rg-col-odds" role="cell">—</div>
                        <div className="rg-cell rg-col-status" role="cell">—</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="frame frame--bar" aria-label="info-bar">
            {(() => {
              const [stake, setStake] = useState<number>(2);
              const presets = [1, 2, 3, 5];
              const viewers = 128;
              const { mode } = useMode();
              const modeLabel = mode === 'real' ? 'USDT' : 'KBITZ';
              const [showChat, setShowChat] = useState(false);
              const [showLeaders, setShowLeaders] = useState(false);
              const [showDev, setShowDev] = useState(false);
              return (
                <div className="test-bottom-bar" role="toolbar" aria-label="Quick actions">
                  <div className="bt-left">
                    <div className="bt-mode" title="Current mode" aria-label="Current mode">
                      {modeLabel}
                    </div>
                    {presets.map((v) => (
                      <button
                        key={`stake-${v}`}
                        className={`bt-chip ${stake === v ? 'is-active' : ''}`}
                        onClick={() => setStake(v)}
                        aria-pressed={stake === v}
                      >
                        ${v}
                      </button>
                    ))}
                  </div>
                  <div className="bt-center">
                    <button className="bt-draw">Draw</button>
                  </div>
                  <div className="bt-right">
                    <div className="bt-viewers" title="Viewers" aria-label="Viewers">
                      <span className="icon" aria-hidden>👁</span>
                      <span className="count">{viewers}</span>
                    </div>
                    <button className="bt-icon" aria-label="Open chat" title="Open chat" onClick={() => { setShowChat((v) => !v); setShowLeaders(false); }}>
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button className="bt-icon" aria-label="Open leaderboard" title="Open leaderboard" onClick={() => { setShowLeaders((v) => !v); setShowChat(false); }}>
                      <FontAwesomeIcon icon={faTrophy} />
                    </button>
                    <button className="bt-icon" aria-label="Open dev tools" title="Open dev tools" onClick={() => { setShowDev((v) => !v); setShowChat(false); setShowLeaders(false); }}>
                      <FontAwesomeIcon icon={faWrench} />
                    </button>
                    {showChat && (
                      <div className="bt-popover chat" role="dialog" aria-label="Chat">
                        <div className="bt-popover__title">Chat (placeholder)</div>
                        <div className="bt-popover__body">Coming soon…</div>
                      </div>
                    )}
                    {showLeaders && (
                      <div className="bt-popover leaders" role="dialog" aria-label="Leaderboard">
                        <div className="bt-popover__title">Leaderboard (placeholder)</div>
                        <div className="bt-popover__body">Top bettors and results…</div>
                      </div>
                    )}
                    {showDev && (
                      <div className="bt-popover dev" role="dialog" aria-label="Dev tools">
                        <div className="bt-popover__title">Dev Tools</div>
                        <div className="bt-popover__body" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
                          <button className="np-btn" onClick={nextPosition} aria-label="Simulate next position">Next position</button>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
                            Auto advance
                          </label>
                          <hr style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} />
                            Follow featured match (auto)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
      <VersionFooter />
    </div>
  );
};

export default TestLayoutPage;

// Helpers local to the Test UI
function formatClockSafe(value?: number, timeFormat?: string): string {
  const parseInitialSeconds = (tf?: string): number | null => {
    if (!tf) return null;
    const base = String(tf).split('+')[0]?.trim();
    const mins = Number.parseInt(base, 10);
    return Number.isFinite(mins) && mins >= 0 ? mins * 60 : null;
  };
  const initialSecs = parseInitialSeconds(timeFormat);
  let seconds: number = Math.max(0, Number(value || 0));
  if (initialSecs != null) seconds = seconds > initialSecs * 10 ? Math.floor(seconds / 1000) : Math.floor(seconds);
  else seconds = seconds > 10000 ? Math.floor(seconds / 1000) : Math.floor(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function buildBoardConfig(game?: Game): Config {
  try {
    const fen = game?.state || undefined;
    let last: [Key, Key] | undefined;
    const hist = (game?.move_hist || []) as Move[];
    if (fen && hist.length) {
      const mv = hist[hist.length - 1];
      last = [mv.from as Key, mv.to as Key];
    }
    const cfg: Config = {
      orientation: 'white',
      coordinates: true,
      viewOnly: true,
      fen: fen as any,
      lastMove: last,
      highlight: { lastMove: true, check: true } as any,
      animation: { duration: 250 } as any,
      draggable: { showGhost: true } as any,
      movable: { free: false, color: 'both' } as any,
    };
    return cfg;
  } catch {
    return {
      orientation: 'white',
      coordinates: true,
      viewOnly: true,
      highlight: { lastMove: true, check: true } as any,
      animation: { duration: 200 } as any,
      draggable: { showGhost: true } as any,
      movable: { free: false, color: 'both' } as any,
    } as Config;
  }
}
