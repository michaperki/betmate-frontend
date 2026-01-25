import React from 'react';
import { Rank } from 'types/leaderboard';
import { User } from 'types/resources/auth';
import { formatNet } from 'utils/currency';

interface RowProps {
  data: Rank,
  rowRef: React.RefObject<HTMLDivElement>
  user: User | null
}

const LeaderboardRow: React.FC<RowProps> = (props) => {
  // Get username and ensure it's not empty/null
  const userName = props.data.user_name || '';

  // Use fallback if name is completely empty
  const displayName = userName.trim() || `Player ${props.data.rank}`;

  // Split for display formatting
  const [firstName, lastName] = displayName.includes(' ') ?
    displayName.split(' ').slice(0, 2) :
    [displayName, ''];

  return (
    <div className={`leaderboard-entry ${props.data.user_id === props.user?._id ? 'current-user' : ''}`} ref={props.rowRef}>
      <div className="rank-info">
        <div className="rank-number">{props.data.rank}</div>
        <div className="player-name">
          {firstName} {lastName ? `${lastName[0]}.` : ''}
        </div>
      </div>
      <div className="player-stats">
        <div className="win-rate">
          <span className="metric-label">Net:</span> {props.data.winnings >= 0 ? '+' : ''}
        </div>
        <div className={`balance ${props.data.winnings >= 0 ? 'positive' : 'negative'}`}>
          {formatNet(props.data.winnings, 'BET')}
        </div>
      </div>
    </div>
  );
};

export { LeaderboardRow };
