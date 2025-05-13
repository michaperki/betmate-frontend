import React from 'react';

import { FeedWager, WagerStatus } from 'types/resources/wager';
import { FeedChat, GameChat } from 'types/resources/game';
import playerIconWhite from 'assets/player_icon_white.svg';
import { getFeedMessage } from './utils';

import './style.scss';

interface ChatWagerProps {
  wager: FeedWager
}

interface ChatMessageProps {
  chat: GameChat
}

interface ChatItemProps {
  item: FeedChat | FeedWager
}

const wagerColors = {
  [WagerStatus.PENDING]: {
    border: 'rgba(255, 231, 94, 0.7)',
    bg: 'rgba(255, 231, 94, 0.15)',
  },
  [WagerStatus.WON]: {
    border: 'rgba(46, 213, 115, 0.7)',
    bg: 'rgba(46, 213, 115, 0.15)',
  },
  [WagerStatus.LOST]: {
    border: 'rgba(255, 71, 87, 0.7)',
    bg: 'rgba(255, 71, 87, 0.15)',
  },
  [WagerStatus.CANCELLED]: {
    border: 'rgba(149, 165, 166, 0.7)',
    bg: 'rgba(149, 165, 166, 0.15)',
  },
};

export const ChatWager: React.FC<ChatWagerProps> = ({ wager }) => (
  <div
    key={wager._id}
    className="chat-wager"
    style={{
      backgroundColor: wagerColors[wager.status]?.bg || 'rgba(149, 165, 166, 0.15)',
      borderLeftColor: wagerColors[wager.status]?.border || 'rgba(149, 165, 166, 0.7)',
    }}
  >
    <p>{getFeedMessage(wager.status, wager.data, wager.wdl, wager.amount, wager.odds)}</p>
  </div>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ chat }) => {
  const [firstName, lastName] = chat.userName.split(' ').slice(0, 2);
  return (
    <div className="chat-message" key={`${chat.userId}_${chat.time}`}>
      <img className="user-icon" src={playerIconWhite} alt="User" width="24" height="24" />
      <div className="chat-data">
        <p className="user-name">{firstName} {lastName ? `${lastName[0]}.` : ''}</p>
        <p className="chat-text">{chat.chat}</p>
      </div>
    </div>
  );
};

export const ChatItem: React.FC<ChatItemProps> = ({ item }) => {
  switch (item.type) {
    case 'message':
      return <ChatMessage chat={item} />;
    case 'wager':
      return <ChatWager wager={item} />;
    default:
      return <div />;
  }
};
