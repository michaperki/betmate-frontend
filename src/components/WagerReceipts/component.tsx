import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { FeedWager, Wager } from 'types/resources/wager';
import { fetchWagers } from 'store/actionCreators/wagerActionCreators';
import { processWagers } from './utils';
import WagerReceiptCard from './WagerReceiptCard';

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

  // Initial fetch when component mounts
  useEffect(() => {
    fetchWagers();
  }, [fetchWagers]);

  // Refetch wagers when a new move is made or game state changes
  useEffect(() => {
    if (gameState || (moveHistory && moveHistory.length > 0)) {
      // Add a small delay to ensure server has completed processing
      const timerId = setTimeout(() => {
        fetchWagers();
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [gameState, moveHistory, fetchWagers]);

  // Get only wagers for this game and process them to show only one entry per wager
  const sortedWagers = processWagers(
    resolvedWagers.filter((w) => w.game_id === gameId)
  );

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
              to="/betting-history"
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
