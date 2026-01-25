import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { FeedWager, Wager } from 'types/resources/wager';
import { fetchWagers, fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import { processWagers } from './utils';
import WagerReceiptCard from './WagerReceiptCard';
import { useMode } from 'context/ModeContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'types/state';

import './dark-style.scss'; // Use the new dark mobile-first styling

export interface WagerReceiptsProps {
  resolvedWagers: Wager[];
  fetchWagers: typeof fetchWagers;
  gameState?: string; // FEN string of current game state
  moveHistory?: Array<any>; // Move history to track when moves are made
}

// Number of wagers to show initially (adjusted for responsive design)
const INITIAL_WAGERS_DISPLAY = 4;

const WagerReceipts: React.FC<WagerReceiptsProps> = ({
  resolvedWagers,
  fetchWagers,
  gameState,
  moveHistory
}) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [displayCount, setDisplayCount] = useState(INITIAL_WAGERS_DISPLAY);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const authUserId = useSelector((s: RootState) => s.auth.user?._id as string | undefined);
  const historyWagers = useSelector((s: RootState) => s.wager.wagerHistory);

  // Initial fetch when authenticated (avoid 401s during JWT restore)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWagers();
    dispatch(fetchWagerHistory(undefined, 10, 0) as any);
  }, [isAuthenticated, fetchWagers, dispatch]);

  // Refetch wagers when a new move is made or game state changes (if authed)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (gameState || (moveHistory && moveHistory.length > 0)) {
      // Add a small delay to ensure server has completed processing
      const timerId = setTimeout(() => {
        fetchWagers();
        dispatch(fetchWagerHistory(undefined, 10, 0) as any);
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [gameState, moveHistory, fetchWagers, dispatch, isAuthenticated]);

  // Hydrate from localStorage to avoid blank state between refresh and network
  const [cached, setCached] = useState<Wager[]>([]);
  useEffect(() => {
    try {
      const key = `betmate:receipts:${authUserId || 'anon'}:${gameId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCached(parsed as Wager[]);
        else setCached([]);
      } else {
        setCached([]);
      }
    } catch {
      setCached([]);
    }
  }, [authUserId, gameId]);

  const { mode } = useMode();
  // Merge local map, fetched history and cached receipts; filter by game & mode
  const mergedForGame = useMemo(() => {
    const pool = [...(resolvedWagers || []), ...(historyWagers || []), ...(cached || [])];
    const byId: Record<string, Wager> = {};
    for (const w of pool) { if (w && !byId[w._id]) byId[w._id] = w; }
    return Object.values(byId)
      .filter((w) => w.game_id === gameId)
      .filter((w) => (mode === 'real' ? ((w as any).mode === 'real') : ((w as any).mode !== 'real')));
  }, [resolvedWagers, historyWagers, cached, gameId, mode]);

  // Process to a single entry per wager, ordered by display time
  const sortedWagers = processWagers(mergedForGame);

  // Get the wagers to display based on current display count
  const displayedWagers = sortedWagers.slice(0, displayCount);
  const hasMoreWagers = sortedWagers.length > displayCount;

  const handleViewMore = () => {
    setDisplayCount(prevCount => prevCount + INITIAL_WAGERS_DISPLAY);
  };

  return (
    <div className="wager-receipts">
      {sortedWagers.length > 0 ? (
        <>
          <div className="receipts-list">
            {displayedWagers.map((wager) => (
              <WagerReceiptCard
                wager={wager}
                key={`${wager.time}-${wager._id}`}
              />
            ))}
          </div>

          {/* Link to future wager history page */}
          {hasMoreWagers && (
            <Link
              to="/bets"
              className="view-more-button"
              aria-label="View complete wager history"
            >
              View Wager History
            </Link>
          )}
        </>
      ) : (
        <div className="empty-receipts">
          <div className="empty-icon" aria-hidden="true">💰</div>
          <h3 className="empty-title">No Wagers Yet</h3>
          <p className="empty-hint">
            Place your first bet to see your wager activity and track your results here
          </p>
          <p className="place-bet-hint">
            Try the Move Bubbles or Draw Button
          </p>
        </div>
      )}
    </div>
  );
};

export default WagerReceipts;
