import React from 'react';

import { FeedWager, WagerStatus } from 'types/resources/wager';
import { FeedChat, GameChat } from 'types/resources/game';
import playerIconWhite from 'assets/player_icon_white.svg';
import { getFeedMessage } from './utils';

interface ChatWagerProps {
  wager: FeedWager
}

interface ChatMessageProps {
  chat: GameChat
}

interface ChatItemProps {
  item: FeedChat | FeedWager
}

export const ChatWager: React.FC<ChatWagerProps> = ({ wager }) => {
  // Handle case where status might be an array (defensive programming)
  const normalizedStatus = Array.isArray(wager.status)
    ? wager.status[0] || WagerStatus.PENDING
    : wager.status;

  // Get the appropriate CSS class for the wager status
  const getStatusClass = (status: WagerStatus) => {
    switch (status) {
      case WagerStatus.PENDING:
        return 'wager-status--pending';
      case WagerStatus.WON:
        return 'wager-status--won';
      case WagerStatus.LOST:
        return 'wager-status--lost';
      case WagerStatus.CANCELLED:
        return 'wager-status--cancelled';
      default:
        return 'wager-status--pending';
    }
  };

  return (
    <div
      key={wager._id}
      className={`wager-status ${getStatusClass(normalizedStatus)}`}
    >
      <p className="m-0 text-sm">
        {getFeedMessage(wager.status, wager.data, wager.wdl, wager.amount, wager.odds)}
      </p>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ chat }) => {
  // Format username to show first name and last initial for privacy
  const [firstName, lastName] = chat.userName.split(' ').slice(0, 2);
  const formattedName = firstName + (lastName ? ` ${lastName[0]}.` : '');

  // Format timestamp for accessibility
  const messageTime = new Date(chat.time).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="chat-message" key={`${chat.userId}_${chat.time}`}>
      <img
        className="user-icon"
        src={playerIconWhite}
        alt="User avatar"
        width="24"
        height="24"
      />
      <div className="chat-data">
        <p className="user-name" title={`Sent at ${messageTime}`}>
          {formattedName}
        </p>
        <p className="chat-text">
          {chat.chat}
        </p>
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
