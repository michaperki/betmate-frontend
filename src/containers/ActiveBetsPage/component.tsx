import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchActiveWagers } from 'store/actionCreators/wagerActionCreators';
import { RootState } from 'types/state';
import { Wager } from 'types/resources/wager';
import './style.scss';

const ActiveBetsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { activeWagers, loading, error } = useSelector((state: RootState) => state.wager);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Fetch active wagers on component mount
  useEffect(() => {
    dispatch(fetchActiveWagers());
    
    // Set up refresh interval
    const interval = setInterval(() => {
      dispatch(fetchActiveWagers());
    }, 30000); // Refresh every 30 seconds
    
    setRefreshInterval(interval);
    
    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [dispatch]);

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

  // Calculate potential win amount
  const calculatePotentialWin = (wager: Wager): number => {
    return wager.amount * wager.odds;
  };

  return (
    <div className="active-bets-page">
      <div className="header">
        <h1>Active Bets</h1>
        <div className="filter-controls">
          <button onClick={() => dispatch(fetchActiveWagers())} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      <div className="bets-container">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Failed to load active bets. Please try again.</p>
            <button onClick={() => dispatch(fetchActiveWagers())}>Retry</button>
          </div>
        ) : activeWagers.length === 0 ? (
          <div className="empty-state">
            <h3>No Active Bets</h3>
            <p>You don't have any active bets at the moment.</p>
            <Link to="/" className="cta-button">
              Browse Matches
            </Link>
          </div>
        ) : (
          activeWagers.map((wager) => (
            <div key={wager._id} className="bet-card">
              <div className="game-info">
                <div className="players">Game ID: {wager.game_id}</div>
                <div className="date">Placed: {formatDate(wager.created_at)}</div>
              </div>
              <div className="bet-details">
                <div className="bet-type">{formatBetData(wager)}</div>
                <div className="odds">Odds: {wager.odds.toFixed(2)}x</div>
              </div>
              <div className="bet-amount">
                <div className="amount">{wager.amount} tokens</div>
                <div className="potential-win">
                  Potential win: {calculatePotentialWin(wager).toFixed(2)} tokens
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveBetsPage;