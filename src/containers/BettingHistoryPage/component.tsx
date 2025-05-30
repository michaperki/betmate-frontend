import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchWagerHistory, fetchUserBettingStats } from 'store/actionCreators/wagerActionCreators';
import { RootState } from 'types/state';
import { Wager, WagerStatus } from 'types/resources/wager';
import './style.scss';

const ITEMS_PER_PAGE = 10;

const BettingHistoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const { wagerHistory, stats, loading, error } = useSelector((state: RootState) => state.wager);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<WagerStatus | 'all'>('all');
  
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
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format bet data for display
  const formatBetData = (wager: Wager): string => {
    if (wager.wdl) {
      // This is a win/draw/loss bet
      return wager.data === 'win' ? 'Win' : wager.data === 'draw' ? 'Draw' : 'Loss';
    } else {
      // This is a move bet
      return `Move: ${wager.data}`;
    }
  };

  // Get class name for status badge
  const getStatusClass = (status: WagerStatus): string => {
    switch (status) {
      case WagerStatus.WON:
        return 'won';
      case WagerStatus.LOST:
        return 'lost';
      case WagerStatus.CANCELLED:
        return 'cancelled';
      default:
        return '';
    }
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
        ) : wagerHistory.length === 0 ? (
          <div className="empty-state">
            <h3>No Betting History</h3>
            <p>You haven't placed any bets yet or no bets match your filter.</p>
            <Link to="/" className="cta-button">
              Browse Matches
            </Link>
          </div>
        ) : (
          <>
            {wagerHistory.map((wager) => (
              <div key={wager._id} className="bet-history-item">
                <div className="game-info">
                  <div className="players">Game ID: {wager.game_id}</div>
                  <div className="date">Placed: {formatDate(wager.created_at)}</div>
                </div>
                <div className="bet-details">
                  <div className="bet-type">{formatBetData(wager)}</div>
                  <div className="odds">Odds: {wager.odds.toFixed(2)}x</div>
                </div>
                <div className="bet-result">
                  <div className="amount">{wager.amount} tokens</div>
                  <div className={`status ${getStatusClass(wager.status)}`}>
                    {wager.status.charAt(0).toUpperCase() + wager.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}

            <div className="pagination">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <button 
                className="active"
              >
                {currentPage}
              </button>
              <button 
                disabled={wagerHistory.length < ITEMS_PER_PAGE} 
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BettingHistoryPage;