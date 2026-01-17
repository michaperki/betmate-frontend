import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Chess } from 'chess.js';
import { Game } from 'types/resources/game';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import {
  onEnterMovePanel,
  onLeaveMovePanel,
  onMoveHover,
  onMoveUnhover,
  createNewArrows,
} from 'store/actionCreators/chessgroundActionCreators';
import { Rank } from 'types/leaderboard';
import MiniLeaderboard from './MiniLeaderboard';
import { getTopMoves, type MoveAnalysis } from 'store/requests/analysisRequests';
import { computeArcadeMoveOdds } from 'utils/pricing';
import { useMode } from 'context/ModeContext';
import { realWdlMultiplier } from 'utils/realOdds';
import { getMultiplier } from 'utils/chess';
import { getRealWdlMarket } from 'store/requests';

import './style.scss';

interface BettingSidebarProps {
  isAuthenticated: boolean;
  games: Record<string, Game>;
  createWager: typeof createWager;
  rankings: Rank[];
  tournamentId?: string;
  onEnterMovePanel?: typeof onEnterMovePanel;
  onLeaveMovePanel?: typeof onLeaveMovePanel;
  onMoveHover?: typeof onMoveHover;
  onMoveUnhover?: typeof onMoveUnhover;
  createNewArrows?: typeof createNewArrows;
}

const STAKE_OPTIONS = [10, 50, 100];

const BettingSidebar: React.FC<BettingSidebarProps> = ({
  isAuthenticated,
  games,
  createWager: placeBet,
  rankings,
  onEnterMovePanel: handleEnterMovePanel,
  onLeaveMovePanel: handleLeaveMovePanel,
  onMoveHover: handleMoveHover,
  onMoveUnhover: handleMoveUnhover,
  createNewArrows: handleCreateNewArrows,
}) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [selectedStake, setSelectedStake] = useState<number>(STAKE_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState<'move' | 'outcome'>('move');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Define game and moveOptions first to avoid "used before defined" errors
  const game = games[gameId];
  const moveOptions = game?.pool_wagers?.move?.options || [];
  const badgeMeta = (game as any)?.badge_meta || null;
  const fen = game?.state;
  const [topMoves, setTopMoves] = useState<MoveAnalysis[]>([]);
  const { mode, risk } = useMode();
  const [realPrices, setRealPrices] = useState<{ white: number; draw: number; black: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!fen) { setTopMoves([]); return; }
        // Compute historical move index if possible
        let atMoveIndex: number | undefined = undefined;
        try {
          const moves: string[] = Array.isArray((game as any)?.move_hist) ? (game as any).move_hist.map((m: any) => String(m.san)).filter(Boolean) : [];
          if (moves.length) {
            const c = new Chess();
            for (let i = 0; i < moves.length; i += 1) { try { c.move(moves[i], { sloppy: true } as any); } catch { break; } if (c.fen() === fen) { atMoveIndex = i + 1; break; } }
            if (atMoveIndex === undefined) atMoveIndex = moves.length;
          }
        } catch {}
        const resp = await getTopMoves(fen, 12, { gameId, atMove: atMoveIndex });
        if (!cancelled) setTopMoves(resp.data || []);
      } catch {
        if (!cancelled) setTopMoves([]);
      }
    })();
    return () => { cancelled = true; };
  }, [fen]);

  // Fetch Real market prices for Outcome tab in Real mode (read-only Phase 1)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (mode !== 'real' || !gameId) { setRealPrices(null); return; }
      try {
        const resp = await getRealWdlMarket(gameId);
        if (!cancelled) setRealPrices(resp?.data?.prices || null);
      } catch {
        if (!cancelled) setRealPrices(null);
      }
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [mode, gameId]);

  // First run initializes the component without triggering panel events
  React.useEffect(() => {
    setHasInitialized(true);
  }, []);

  // This effect is now only for cleaning up when switching tabs
  React.useEffect(() => {
    // Skip the effect on initial render
    if (!hasInitialized) return;

    // First, make sure any existing arrows are cleared
    if (handleMoveUnhover) {
      handleMoveUnhover();
    }

    // Only handle leaving the move panel when switching tabs
    if (activeTab === 'outcome' && handleLeaveMovePanel) {
      handleLeaveMovePanel();
    }

    // We've removed all automatic entry to onEnterMovePanel
    // Arrows will only appear when mouse physically enters the panel
  }, [activeTab, handleLeaveMovePanel, handleMoveUnhover, hasInitialized]);

  // We're removing this auto-generate effect entirely
  // Arrows will now ONLY be created when mouse enters the move panel
  // via the handleMovePanelMouseEnter function
  // Ensure moveOptions is properly typed
  // Compute Arcade odds for offered moves; default to 1x if unavailable
  const offeredMoves = Array.isArray(moveOptions) ? moveOptions.map(m => (typeof m === 'string' ? m : (m as any)?.move)).filter(Boolean) : [] as string[];
  const oddsByMove = useMemo(() => computeArcadeMoveOdds(offeredMoves, (topMoves || []).map(t => ({ move: t.move, score: t.score }))), [offeredMoves.join('|'), topMoves]);
  const typedMoveOptions: Array<{ move: string; odds: number }> = Array.isArray(moveOptions)
    ? moveOptions.map((move) => {
        const mv = (typeof move === 'string') ? move : (move as any)?.move;
        const o = mode === 'arcade' ? Number(oddsByMove[mv] || 1) : 1;
        return { move: mv, odds: o };
      })
    : [];
  const outcomeOptions = game?.odds || {};

  const handleBetMove = (moveOption: string) => () => {
    if (!isAuthenticated || !selectedStake) return;

    placeBet(
      gameId,
      moveOption,
      selectedStake,
      false, // not WDL
      mode === 'arcade' ? Number(oddsByMove[moveOption] || 1) : 1,
      game.move_hist.length + 1,
    );
  };

  const handleMovePieceHover = (moveOption: string) => () => {
    if (handleMoveHover && game) {
      const chess = new Chess(game.state);
      try {
        const moveObj = chess.move(moveOption, { sloppy: true });
        if (moveObj) {
          handleMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
        }
      } catch (e) {
        console.error('Invalid move', e);
      }
    }
  };

  const handleMovePieceUnhover = () => {
    if (handleMoveUnhover) {
      handleMoveUnhover();
    }
  };

  const handleBetOutcome = (outcome: string) => () => {
    if (!isAuthenticated || !selectedStake) return;

    const p = Number(outcomeOptions[outcome] || 0);
    const offeredMult = mode === 'real'
      ? realWdlMultiplier(outcome as any, p, undefined, risk as any)
      : (p > 0 ? (1 / p) : 1);

    placeBet(
      gameId,
      outcome,
      selectedStake,
      true, // is WDL
      offeredMult,
      game.move_hist.length + 1,
      mode,
      mode === 'real' ? 'USDT' : 'BET',
    );
  };

  const formatPayout = (odds: number) => {
    // Ensure odds is a valid number
    if (!odds || Number.isNaN(odds) || !Number.isFinite(odds)) {
      return '0.0';
    }
    // Calculate payout with numeric odds
    return (odds * selectedStake).toFixed(1);
  };

  // Handlers for mouse entering/leaving the move panel section
  const handleMovePanelMouseEnter = () => {
    if (hasInitialized && activeTab === 'move') {
      // First trigger the panel entry event
      if (handleEnterMovePanel) {
        handleEnterMovePanel();
      }

      // Then create the arrows for possible moves
      if (game && handleCreateNewArrows && game.pool_wagers?.move?.options) {
        handleCreateNewArrows(game.state, game.pool_wagers.move.options);
      }
    }
  };

  const handleMovePanelMouseLeave = () => {
    if (hasInitialized && activeTab === 'move' && handleLeaveMovePanel) {
      handleLeaveMovePanel();
    }
  };

  return (
    <div className="betting-sidebar-container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'move' ? 'active' : ''}`}
          onClick={() => setActiveTab('move')}
        >
          Move
        </button>
        <button
          className={`tab-button ${activeTab === 'outcome' ? 'active' : ''}`}
          onClick={() => setActiveTab('outcome')}
        >
          Outcome
        </button>
      </div>

      {/* Content Panel */}
      <div className="tab-content">
        {activeTab === 'move' ? (
          /* Move Betting Panel */
          <>
            <div
              className="bet-explanation"
              onMouseEnter={handleMovePanelMouseEnter}
              onMouseLeave={handleMovePanelMouseLeave}
            >
              Bet on which move will happen next. Win {mode === 'real' ? 'USDT' : 'KBITZ'} from the pool.
            </div>

            <div
              className="options-container"
              onMouseEnter={handleMovePanelMouseEnter}
              onMouseLeave={handleMovePanelMouseLeave}
            >
              {typedMoveOptions.length === 0 ? (
                <div className="no-options">
                  No moves available to bet on
                </div>
              ) : (
                <ul className="bet-options-list">
                  {typedMoveOptions
                    .filter((m) => m && m.move)
                    .map((m, i) => (
                      <li
                        key={`move-${m.move}-${i}`}
                        className="bet-option"
                        onClick={handleBetMove(m.move)}
                        onMouseEnter={handleMovePieceHover(m.move)}
                        onMouseLeave={handleMovePieceUnhover}
                      >
                        <span className="option-name">
                          {m.move}
                          {/* Inline badge from server (emoji/opening) */}
                          {badgeMeta?.badges?.[m.move] && badgeMeta?.badges?.[m.move].badge_type !== 'none' && (
                            <span
                              className={`option-badge ${badgeMeta.badges[m.move].badge_type}`}
                              title={badgeMeta.badges[m.move].badge_detail || ''}
                              style={{ marginLeft: 6 }}
                            >
                              {badgeMeta.badges[m.move].badge_text}
                            </span>
                          )}
                        </span>
                        <span className="option-payout">{formatPayout(m.odds)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          /* Outcome Betting Panel */
          <>
            <div className="bet-explanation">
              {mode === 'real'
                ? 'Real market prices (read-only preview).'
                : 'Bet on the outcome of the game. Win KBITZ from the house.'}
            </div>

            <div className="options-container">
              {!outcomeOptions || Object.keys(outcomeOptions).length === 0 ? (
                <div className="no-options">
                  No outcomes available to bet on
                </div>
              ) : (
                <ul className="bet-options-list">
                  {Object.entries(outcomeOptions).map(([outcome, odds]) => {
                    const key = String(outcome);
                    const p = Number(odds || 0);
                    const mult = mode === 'real'
                      ? realWdlMultiplier(key as any, p, undefined, risk as any)
                      : (p > 0 ? (1 / p) : 0);
                    const label = key;
                    return (
                      <li
                        key={`outcome-${key}`}
                        className={`bet-option outcome-${key}`}
                        onClick={handleBetOutcome(key)}
                        aria-disabled={false}
                        title={mult ? `Payout ${getMultiplier(mult)}x` : ''}
                      >
                        <span className="option-name">{label}</span>
                        <span className="option-payout">
                          {`${getMultiplier(mult)}x`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="stake-buttons">
          {STAKE_OPTIONS.map((stake) => (
            <button
              key={`stake-${stake}`}
              className={`stake-button ${selectedStake === stake ? 'active' : ''}`}
              onClick={() => setSelectedStake(stake)}
            >
              {stake}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BettingSidebar;
