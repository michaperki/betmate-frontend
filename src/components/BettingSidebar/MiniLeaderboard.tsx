import React from 'react';
import { Rank } from 'types/leaderboard';
import './style.scss';

interface MiniLeaderboardProps {
  rankings: Rank[];
}

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ rankings }) => {
  // Display up to 5 top players instead of just 3
  const topRankings = rankings.slice(0, 5);
  const hasRankings = rankings && rankings.length > 0;

  return (
    <div className="mini-leaderboard">
      <h3 className="mini-leaderboard-title">Leaderboard</h3>
      {hasRankings ? (
        <ul className="leaderboard-list">
          {topRankings.map((rank, index) => (
            <li
              key={rank.user_id}
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
