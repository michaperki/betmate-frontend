import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchWagerHistory, fetchUserBettingStats } from 'store/actionCreators/wagerActionCreators';
import { RootState } from 'types/state';
import { Wager, WagerStatus } from 'types/resources/wager';
import { Game } from 'types/resources/game';
import './style.scss';

const ITEMS_PER_PAGE = 10;

const BettingHistoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const { wagerHistory, stats, loading, error } = useSelector((state: RootState) => state.wager);
  const games = useSelector((state: RootState) => state.game.games);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<WagerStatus | 'all'>('all');
  const [items, setItems] = useState<Wager[]>([]);
  const [hasMore, setHasMore] = useState(false);
  
  // Stats for the stats bar
  const [historyStats, setHistoryStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    cancelledBets: 0,
  });

  // Fetch wager history when component mounts or filters change
  useEffect(() => {
    const status = statusFilter === 'all' ? undefined : statusFilter;
    dispatch(fetchWagerHistory(status, ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE));
    dispatch(fetchUserBettingStats());
  }, [dispatch, statusFilter, currentPage]);

  // Append/replace local list based on paging
  useEffect(() => {
    if (loading || error != null) return;
    if (currentPage === 1) setItems(wagerHistory);
    else setItems((prev) => prev.concat(wagerHistory));
    setHasMore(wagerHistory.length === ITEMS_PER_PAGE);
  }, [wagerHistory, loading, error, currentPage]);

  // Calculate stats based on the filtered history
  useEffect(() => {
    if (wagerHistory.length) {
      const wonBets = wagerHistory.filter(wager => wager.status === WagerStatus.WON).length;
      const lostBets = wagerHistory.filter(wager => wager.status === WagerStatus.LOST).length;
      const cancelledBets = wagerHistory.filter(wager => wager.status === WagerStatus.CANCELLED).length;
      
      setHistoryStats({
        totalBets: wagerHistory.length,
        wonBets,
        lostBets,
        cancelledBets,
      });
    }
  }, [wagerHistory]);

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as WagerStatus | 'all';
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
    setItems([]);
  };

  // Format bet data for display (WDL vs Move)
  const formatBetData = (wager: Wager): string => {
    if (wager.wdl) {
      const map: Record<string, string> = {
        white_win: 'White to win',
        black_win: 'Black to win',
        draw: 'Draw'
      };
      return map[wager.data] || wager.data;
    }
    return `Move: ${wager.data}`;
  };

  const formatNet = (w: Wager): { text: string; cls: string } | null => {
    if (w.status === WagerStatus.WON) {
      const net = (w.amount * w.odds) - w.amount;
      return { text: `Net +$${net.toFixed(2)}`, cls: 'net-positive' };
    }
    if (w.status === WagerStatus.LOST) {
      return { text: `Net -$${w.amount.toFixed(2)}`, cls: 'net-negative' };
    }
    if (w.status === WagerStatus.CANCELLED) {
      return { text: 'Refund', cls: 'net-refund' };
    }
    return null;
  };

  return (
    <div className="betting-history-page">
      <div className="header">
        <h1>Betting History</h1>
        <div className="filter-controls">
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="all">All Bets</option>
            <option value={WagerStatus.WON}>Won</option>
            <option value={WagerStatus.LOST}>Lost</option>
            <option value={WagerStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{stats.totalWagers}</div>
          <div className="stat-label">Total Bets</div>
        </div>
        <div className="stat-card stat-card--won">
          <div className="stat-value">{stats.winRate.toFixed(1)}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
        <div className="stat-card stat-card--won">
          <div className="stat-value">{historyStats.wonBets}</div>
          <div className="stat-label">Won Bets</div>
        </div>
        <div className="stat-card stat-card--lost">
          <div className="stat-value">{historyStats.lostBets}</div>
          <div className="stat-label">Lost Bets</div>
        </div>
      </div>

      <div className="history-container">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Failed to load betting history. Please try again.</p>
            <button onClick={() => dispatch(fetchWagerHistory())}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No Betting History</h3>
            <p>You haven't placed any bets yet or no bets match your filter.</p>
            <Link to="/" className="cta-button">
              Browse Matches
            </Link>
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
                    <div className="bet-type">{formatBetData(wager)}</div>
                    <div className="odds">{wager.odds.toFixed(2)}x</div>
                  </div>
                  <div className="bet-result">
                    <div className="amount">{wager.amount} tokens</div>
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

export default BettingHistoryPage;
