import React from 'react';
import { Rank } from 'types/leaderboard';
import './style.scss';

interface MiniLeaderboardProps {
  rankings: Rank[];
}

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ rankings }) => {
  const topRankings = rankings.slice(0, 3);

  // Still render the leaderboard container even if empty
  const hasRankings = rankings && rankings.length > 0;

  return (
    <div className="mini-leaderboard">
      <h3 className="mini-leaderboard-title">Top Players</h3>
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
                {rank.winnings.toFixed(1)}
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
