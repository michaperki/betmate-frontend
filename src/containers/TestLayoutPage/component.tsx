import React, { useEffect, useMemo, useRef, useState } from 'react';
import NavBar from 'components/NavBar';
import VersionFooter from 'components/VersionFooter';
import './style.scss';
import ChessgroundWrapper from 'components/ChessgroundWrapper';
import { Config } from 'chessground/config';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useMode } from 'context/ModeContext';

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

  // Demo move tiles for Left panel
  const demoMoves = useMemo(() => ([
    { label: 'Move A', score: 100 },
    { label: 'Move B', score: 90 },
    { label: 'Move C', score: 60 },
    { label: 'Move D', score: 60 },
  ]), []);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const [leftCols, setLeftCols] = useState(2);
  const [leftTile, setLeftTile] = useState(80);
  type TileStatus = 'idle' | 'active' | 'disabled' | 'loading' | 'success';
  const [tileStates, setTileStates] = useState<TileStatus[]>(() => demoMoves.map(() => 'idle'));
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
        const n = demoMoves.length;
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
      for (let c = 1; c <= demoMoves.length; c += 1) {
        const rows = Math.ceil(demoMoves.length / c);
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
  }, [demoMoves.length]);

  return (
    <div className="test-layout-page">
      <NavBar compact={true} />
      <main className="test-layout-page__content">
        <div className="test-layout-grid">
          <div className="frame frame--left" aria-label="left-panel">
            {(() => {
              const styleVars = { ['--cols' as any]: leftCols, ['--tile' as any]: `${leftTile}px` };
              return (
                <div className="left-panel" ref={leftPanelRef} style={styleVars}>
                  {demoMoves.map((m, i) => {
                    const st = tileStates[i] || 'idle';
                    const classes = ['lp-tile', `is-${st}`].join(' ');
                    return (
                      <div
                        key={m.label + i}
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
                          <span className="lp-score">{m.score}</span>
                        </div>
                      </div>
                    );
                  })}
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
                  topState.clock === 'ticking' ? 'is-ticking' : 'is-idle',
                  topState.active === 'active' ? 'is-active' : 'is-inactive',
                  topState.confirm === 'loading' ? 'is-loading' : '',
                  topState.confirm === 'confirmed' ? 'is-confirmed' : '',
                  topState.confirm === 'rejected' ? 'is-rejected' : '',
                ].filter(Boolean).join(' ')}
                onClick={cycleTop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleTop(); }}
                aria-label="Toggle Player 1 header state"
              >
                <div className="ph-left">
                  <div className="ph-name">Player 1</div>
                  <div className="ph-rating">2420</div>
                </div>
                <div className="ph-right">
                  <div className="ph-clock">
                    <span>05:00</span>
                    <span className="tick-dot" aria-hidden />
                  </div>
                  <div className="ph-state-chip" aria-hidden />
                </div>
              </div>
              <div className="board-center">
                <div className="board-square">
                  <div className="chessboard-wrapper brown" style={{ width: '100%', height: '100%' }}>
                    <ChessgroundWrapper
                      config={{
                        orientation: 'white',
                        coordinates: true,
                        viewOnly: true,
                        highlight: { lastMove: true, check: true } as any,
                        animation: { duration: 200 } as any,
                        draggable: { showGhost: true } as any,
                        movable: { free: false, color: 'both' } as any,
                      } as Config}
                    />
                  </div>
                </div>
                <div className="eval-bar"><span className="board__label">Eval</span></div>
              </div>
              <div
                className={[
                  'board-header',
                  'board-header--bottom',
                  bottomState.clock === 'ticking' ? 'is-ticking' : 'is-idle',
                  bottomState.active === 'active' ? 'is-active' : 'is-inactive',
                  bottomState.confirm === 'loading' ? 'is-loading' : '',
                  bottomState.confirm === 'confirmed' ? 'is-confirmed' : '',
                  bottomState.confirm === 'rejected' ? 'is-rejected' : '',
                ].filter(Boolean).join(' ')}
                onClick={cycleBottom}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleBottom(); }}
                aria-label="Toggle Player 2 header state"
              >
                <div className="ph-left">
                  <div className="ph-name">Player 2</div>
                  <div className="ph-rating">2510</div>
                </div>
                <div className="ph-right">
                  <div className="ph-clock">
                    <span>04:32</span>
                    <span className="tick-dot" aria-hidden />
                  </div>
                  <div className="ph-state-chip" aria-hidden />
                </div>
              </div>
            </div>
          </div>
          <div className="frame frame--right-top" aria-label="right-top">
            {(() => {
              const demoSAN = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'];
              const [cursor, setCursor] = useState(demoSAN.length - 1);
              const back = () => setCursor((i) => Math.max(0, i - 1));
              const fwd = () => setCursor((i) => Math.min(demoSAN.length - 1, i + 1));
              const start = () => setCursor(0);
              const end = () => setCursor(demoSAN.length - 1);
              return (
                <div className="notation-pad" role="region" aria-label="Notation pad (demo)">
                  <div className="notation-controls">
                    <button className="np-btn" onClick={start} aria-label="Go to start">⏮</button>
                    <button className="np-btn" onClick={back} aria-label="Step back">◀</button>
                    <button className="np-btn" onClick={fwd} aria-label="Step forward">▶</button>
                    <button className="np-btn" onClick={end} aria-label="Go to end">⏭</button>
                    <div className="np-spacer" />
                    <div className="np-status">{cursor + 1} / {demoSAN.length}</div>
                  </div>
                  <div className="notation-list" role="list">
                    {demoSAN.map((san, i) => (
                      <div
                        key={i}
                        role="listitem"
                        className={[
                          'notation-move',
                          i === cursor ? 'is-active' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => setCursor(i)}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCursor(i); }}
                        aria-current={i === cursor ? 'true' : undefined}
                      >
                        <span className="nm-index">{i + 1}.</span>
                        <span className="nm-san">{san}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="frame frame--right-bottom" aria-label="right-bottom">
            {(() => {
              type ReceiptStatus = 'pending' | 'won' | 'lost' | 'cancelled';
              type Receipt = {
                id: string;
                type: 'move' | 'outcome';
                label: string;
                stake: number;
                odds: number;
                status: ReceiptStatus;
              };
              const [receipts, setReceipts] = useState<Receipt[]>([
                { id: 'r1', type: 'outcome', label: 'White', stake: 25, odds: 1.85, status: 'pending' },
                { id: 'r2', type: 'move', label: 'Nf3', stake: 10, odds: 3.2, status: 'won' },
                { id: 'r3', type: 'outcome', label: 'Draw', stake: 15, odds: 3.8, status: 'lost' },
                { id: 'r4', type: 'move', label: 'Bb5', stake: 12, odds: 2.6, status: 'cancelled' },
              ]);
              const cycle = (id: string) => {
                setReceipts((prev) => prev.map((r) => {
                  if (r.id !== id) return r;
                  const order: ReceiptStatus[] = ['pending', 'won', 'lost', 'cancelled'];
                  const idx = order.indexOf(r.status);
                  return { ...r, status: order[(idx + 1) % order.length] };
                }));
              };
              const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
              const fmtStake = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
              const fmtOdds = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
              return (
                <div className="receipts-grid" role="table" aria-label="Wager receipts">
                  <div className="rg-head" role="row">
                    <div className="rg-cell rg-col-bet" role="columnheader">Bet</div>
                    <div className="rg-cell rg-col-stake" role="columnheader">Stake</div>
                    <div className="rg-cell rg-col-odds" role="columnheader">Odds</div>
                    <div className="rg-cell rg-col-status" role="columnheader">Status</div>
                  </div>
                  <div className="rg-body">
                    {receipts.map((w) => (
                      <div
                        key={w.id}
                        className={['rg-row', `is-${w.status}`, `type-${w.type}`].join(' ')}
                        role="row"
                        onClick={() => cycle(w.id)}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycle(w.id); }}
                      >
                        <div className="rg-cell rg-col-bet" role="cell">
                          <span className={["rg-type-dot", w.type].join(' ')} aria-hidden />
                          <span className="rg-label" title={w.label}>{w.label}</span>
                        </div>
                        <div className="rg-cell rg-col-stake" role="cell">{fmtStake(w.stake)}</div>
                        <div className="rg-cell rg-col-odds" role="cell">{fmtOdds(w.odds)}</div>
                        <div className="rg-cell rg-col-status" role="cell">{w.status}</div>
                      </div>
                    ))}
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
