import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchActiveWagers } from 'store/actionCreators/wagerActionCreators';
import { RootState } from 'types/state';
import { Wager } from 'types/resources/wager';
import { Game } from 'types/resources/game';
import { formatAmount } from 'utils/currency';
import './style.scss';
import './panel.scss';

// Embedded panel version of Active Bets for dashboard tabs
// Keeps list rendering and states, drops page title wrapper
const ActiveBetsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { activeWagers, loading, error } = useSelector((state: RootState) => state.wager);
  const games = useSelector((state: RootState) => state.game.games);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(fetchActiveWagers());
    const interval = setInterval(() => {
      dispatch(fetchActiveWagers());
    }, 30000);
    setRefreshInterval(interval);
    return () => { if (refreshInterval) clearInterval(refreshInterval); };
  }, [dispatch]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatBetData = (wager: Wager): string => {
    if (wager.wdl) {
      const map: Record<string, string> = { white_win: 'White to win', black_win: 'Black to win', draw: 'Draw' };
      return map[wager.data] || wager.data;
    }
    return `Move: ${wager.data}`;
  };

  const calculatePotentialWin = (wager: Wager): number => {
    return (wager.amount || 0) * (wager.odds || 1);
  };

  return (
    <div className="active-bets-page active-bets-panel">
      <div className="header">
        <div className="filter-controls">
          <button onClick={() => dispatch(fetchActiveWagers())} className="refresh-button">Refresh</button>
        </div>
      </div>

      <div className="bets-container">
        {loading ? (
          <div className="loading"><div className="loading-spinner"></div></div>
        ) : error ? (
          <div className="error-state">
            <p>Failed to load active bets. Please try again.</p>
            <button onClick={() => dispatch(fetchActiveWagers())}>Retry</button>
          </div>
        ) : activeWagers.length === 0 ? (
          <div className="empty-state">
            <h3>No Active Bets</h3>
            <p>You don't have any active bets at the moment.</p>
            <Link to="/" className="cta-button">Browse Matches</Link>
          </div>
        ) : (
          activeWagers.map((wager) => {
            const game: Game | undefined = games[wager.game_id];
            const white = game?.player_white?.name || 'White';
            const black = game?.player_black?.name || 'Black';
            return (
              <div key={wager._id} className="bet-card">
                <div className="game-info">
                  <div className="match-title">
                    <span className="player player--white">{white}</span>
                    <span className="vs">vs</span>
                    <span className="player player--black">{black}</span>
                  </div>
                  <div className="meta">
                    <span className="placed">Placed {formatDate(wager.created_at)}</span>
                    <span className="dot">•</span>
                    <Link to={`/chess/${wager.game_id}`} className="view-link">View match</Link>
                  </div>
                </div>
                <div className="bet-details">
                  <div className="bet-type">{formatBetData(wager)}</div>
                  <div className="odds">{wager.odds.toFixed(2)}x</div>
                </div>
                <div className="bet-amount">
                  <div className="amount">{formatAmount(wager.amount, ((wager as any).currency as any) || (((wager as any).mode === 'real') ? 'USDT' : 'BET'))}</div>
                  <div className="potential-win">Potential win {formatAmount(calculatePotentialWin(wager), ((wager as any).currency as any) || (((wager as any).mode === 'real') ? 'USDT' : 'BET'))}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActiveBetsPanel;
