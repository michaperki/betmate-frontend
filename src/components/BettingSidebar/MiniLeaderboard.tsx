import React from 'react';
import { Rank } from 'types/leaderboard';
import './style.scss';

interface MiniLeaderboardProps {
  rankings: Rank[];
  showTitle?: boolean; // optionally render a header
}

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ rankings = [], showTitle = true }) => {
  // Add defensive check for rankings
  const validRankings = Array.isArray(rankings) ? rankings : [];

  // Display up to 5 top players instead of just 3
  const topRankings = validRankings.slice(0, 5);
  const hasRankings = validRankings.length > 0;

  // Ensure each ranking has all the required fields
  const safeRankings = topRankings.map(rank => {
    // Get username and ensure it exists
    const userName = rank.user_name || '';

    // Use fallback if name is completely empty
    const displayName = userName.trim() || `Player ${rank.rank || 1}`;

    return {
      user_id: rank.user_id || 'unknown',
      user_name: displayName,
      rank: rank.rank || 1,
      winnings: typeof rank.winnings === 'number' ? rank.winnings : 0
    };
  });

  return (
    <div className="mini-leaderboard">
      {showTitle && <h3 className="mini-leaderboard-title">Leaderboard</h3>}
      {hasRankings ? (
        <ul className="leaderboard-list">
          {safeRankings.map((rank, index) => (
            <li
              key={rank.user_id + '-' + index}
              className={`leaderboard-item ${index === 0 ? 'first-place' : ''}`}
            >
              <div className="player-info">
                <span className={`rank-badge rank-${index + 1}`}>
                  {index + 1}
                </span>
                <span className="player-name">
                  {rank.user_name}
                </span>
              </div>
              <span className="player-score">
                {rank.winnings > 0 ? '+' : ''}{rank.winnings.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-rankings">No player data available</div>
      )}
    </div>
  );
};

export default MiniLeaderboard;
