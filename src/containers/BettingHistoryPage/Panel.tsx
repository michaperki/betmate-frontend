import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchWagerHistory, fetchUserBettingStats } from 'store/actionCreators/wagerActionCreators';
import { RootState } from 'types/state';
import { Wager, WagerStatus } from 'types/resources/wager';
import { Game } from 'types/resources/game';
import { useMode } from 'context/ModeContext';
import { getMultiplier } from 'utils/chess';
import { formatAmount as fmtAmount } from 'utils/currency';
import './style.scss';
import './panel.scss';

const ITEMS_PER_PAGE = 10;

// Embedded panel version of Betting History for dashboard tabs
// Keeps filter + history list; drops page H1 and stats bar
const BettingHistoryPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { wagerHistory, stats, loading, error } = useSelector((state: RootState) => state.wager);
  const games = useSelector((state: RootState) => state.game.games);
  const { mode } = useMode();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<WagerStatus | 'all'>('all');
  const [items, setItems] = useState<Wager[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const status = statusFilter === 'all' ? undefined : statusFilter;
    dispatch(fetchWagerHistory(status, ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE));
    dispatch(fetchUserBettingStats());
  }, [dispatch, statusFilter, currentPage]);

  useEffect(() => {
    if (loading || error != null) return;
    const filtered = wagerHistory.filter((w) => (mode === 'real' ? ((w as any).mode === 'real') : ((w as any).mode !== 'real')));
    if (currentPage === 1) setItems(filtered);
    else setItems((prev) => prev.concat(filtered));
    setHasMore(filtered.length === ITEMS_PER_PAGE);
  }, [wagerHistory, loading, error, currentPage, mode]);

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as WagerStatus | 'all';
    setStatusFilter(value);
    setCurrentPage(1);
    setItems([]);
  };

  const formatBetData = (wager: Wager): string => {
    if (wager.wdl) {
      const map: Record<string, string> = { white_win: 'White to win', black_win: 'Black to win', draw: 'Draw' };
      return map[wager.data] || wager.data;
    }
    return `Move: ${wager.data}`;
  };

  const formatAmount = (w: Wager): string => fmtAmount(w.amount || 0, (((w as any).currency as any) || (((w as any).mode === 'real') ? 'USDT' : 'BET')));

  const formatNet = (w: Wager): { text: string; cls: string } | null => {
    const isReal = (w as any).mode === 'real';
    const curr = (w as any).currency || 'BET';
    const sign = (x: number) => (x >= 0 ? '+' : '-');
    const abs = (x: number) => Math.abs(x);
    if (w.status === WagerStatus.WON) {
      let mult = 1;
      if (w.wdl) mult = isReal ? (w.odds || 1) : (w.odds || 1);
      else mult = isReal ? (w.winning_pool_share || 0) : (w.odds || 1);
      const net = (w.amount * mult) - w.amount;
      return { text: `Net ${sign(net)}${fmtAmount(abs(net), curr as any).replace(/^\+|^-/, '')}` , cls: 'net-positive' };
    }
    if (w.status === WagerStatus.LOST) {
      return { text: `Net -${fmtAmount(w.amount || 0, curr as any).replace(/^\+|^-/, '')}`, cls: 'net-negative' };
    }
    if (w.status === WagerStatus.CANCELLED) {
      return { text: 'Refund', cls: 'net-refund' };
    }
    return null;
  };

  const typeIcon = (w: Wager) => (w.wdl ? '🏁' : '🎯');
  const payoutBadge = (w: Wager) => {
    const isReal = (w as any).mode === 'real';
    if (w.wdl) return `x${getMultiplier(w.odds || 1)}`;
    if (isReal) {
      return (w.status === WagerStatus.WON && Number.isFinite(w.winning_pool_share) && (w.winning_pool_share || 0) > 0)
        ? `x${getMultiplier(w.winning_pool_share)}` : '';
    }
    return `x${getMultiplier(w.odds || 1)}`;
  };

  return (
    <div className="betting-history-page betting-history-panel">
      <div className="header">
        <div className="filter-controls">
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="all">All Bets</option>
            <option value={WagerStatus.WON}>Won</option>
            <option value={WagerStatus.LOST}>Lost</option>
            <option value={WagerStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="history-container">
        {loading ? (
          <div className="loading"><div className="loading-spinner"></div></div>
        ) : error ? (
          <div className="error-state">
            <p>Failed to load betting history. Please try again.</p>
            <button onClick={() => dispatch(fetchWagerHistory())}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No Betting History</h3>
            <p>You haven't placed any bets yet or no bets match your filter.</p>
            <Link to="/" className="cta-button">Browse Matches</Link>
          </div>
        ) : (
          <>
            {items.map((wager) => {
              const game: Game | undefined = games[wager.game_id];
              const white = game?.player_white?.name || 'White';
              const black = game?.player_black?.name || 'Black';
              const net = formatNet(wager);
              return (
                <div key={wager._id} className="bet-history-item">
                  <div className="game-info">
                    <div className="match-title">
                      <span className="player player--white">{white}</span>
                      <span className="vs">vs</span>
                      <span className="player player--black">{black}</span>
                    </div>
                    <div className="meta"><Link to={`/chess/${wager.game_id}`} className="view-link">View match</Link></div>
                  </div>
                  <div className="bet-details">
                    <div className="bet-type"><span className={`bh-type ${wager.wdl ? 'bh-type--outcome' : 'bh-type--move'}`} aria-hidden>{typeIcon(wager)}</span>{formatBetData(wager)}</div>
                    <div className="odds">{payoutBadge(wager)}</div>
                  </div>
                  <div className="bet-result">
                    <div className="amount">{formatAmount(wager)}</div>
                    <div className={`net ${net ? net.cls : ''}`}>{net ? net.text : ''}</div>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <div className="load-more">
                <button onClick={() => setCurrentPage((p) => p + 1)} disabled={loading}>Load more</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BettingHistoryPanel;
