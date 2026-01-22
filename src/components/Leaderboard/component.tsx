import React, { useEffect, useRef } from 'react';
import BidirectionalScroll from '@jakeane/react-bidirectional-infinite-scroll';
import ordinal from 'ordinal';

import {
  onLeaderboardScroll,
  getLeaderboardHead,
  extendLeaderboardTop,
  extendLeaderboardBottom,
  getUserRank,
  goToUserPosition,
  leaveUserPosition,
} from 'store/actionCreators/leaderboardActionCreators';
import { User } from 'types/resources/auth';
import { Rank } from 'types/leaderboard';
import { LeaderboardRow } from './helpers';

import './styles.scss';

interface LeaderboardProps {
  user: User | null
  rankings: Rank[]
  position: number
  userRank: number
  atUser: boolean
  onLeaderboardScroll: typeof onLeaderboardScroll
  getLeaderboardHead: typeof getLeaderboardHead
  extendLeaderboardTop: typeof extendLeaderboardTop
  extendLeaderboardBottom: typeof extendLeaderboardBottom
  getUserRank: typeof getUserRank
  goToUserPosition: typeof goToUserPosition
  leaveUserPosition: typeof leaveUserPosition
}

const Leaderboard: React.FC<LeaderboardProps> = (props) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleReachTop = () => {
    const rowSize = rowRef.current?.clientHeight ?? 0;
    props.extendLeaderboardTop(rowSize);
  };

  const handleRankClick = () => {
    const rowSize = rowRef.current?.clientHeight ?? 0;
    props.goToUserPosition(rowSize);
  };

  const handleReset = () => {
    if (!props.atUser) return;
    props.leaveUserPosition();
  };

  useEffect(() => {
    props.getLeaderboardHead();
  }, []);

  useEffect(() => {
    if (props.user) props.getUserRank();
  }, [props.user]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <div className="title-area">
          <h2>Leaderboard 🏅</h2>
          <div className="leaderboard-subtitle">Ranked by net winnings</div>
        </div>
        <button
          className={`reset-button ${props.atUser ? 'active' : ''}`}
          onClick={handleReset}
          title="Reset leaderboard view"
          aria-label="Reset leaderboard view"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="reset-icon">
            <path d="M18 5C16.597 2.04 13.537 0 10 0C8.8181 0 7.64778 0.23279 6.55585 0.68508C5.46392 1.13738 4.47177 1.80031 3.63604 2.63604C2.80031 3.47177 2.13738 4.46392 1.68508 5.55585C1.23279 6.64778 1 7.8181 1 9C1 10.1819 1.23279 11.3522 1.68508 12.4442C2.13738 13.5361 2.80031 14.5282 3.63604 15.364C4.47177 16.1997 5.46392 16.8626 6.55585 17.3149C7.64778 17.7672 8.8181 18 10 18C14 18.5 18 15.364 18.5 11M18 5L19 0M18 5L13 6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      <div className="leaderboard-card" >
        <BidirectionalScroll
          onReachBottom={props.extendLeaderboardBottom}
          onReachTop={handleReachTop}
          position={props.position}
          onScroll={props.onLeaderboardScroll}
        >
          {props.rankings.map((rankData) => (
            <LeaderboardRow
              key={rankData.user_id}
              data={rankData}
              user={props.user}
              rowRef={rowRef}
            />
          ))}
        </BidirectionalScroll>
        {(!props.atUser && props.userRank) && (
          <div
            className="user-rank"
            onClick={handleRankClick}
          >
          Your ranking: {ordinal(props.userRank)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
