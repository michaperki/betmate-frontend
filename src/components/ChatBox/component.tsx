import React, { useState } from 'react';
import { useParams } from 'react-router';
import './dark-style.scss'; // Use the new dark mobile-first styling
import { FeedChat } from 'types/resources/game';
import { sendGameChat } from 'store/actionCreators/gameActionCreators';
import { ChatMessage } from './helper_components';

export interface ChatBoxProps {
  chats: FeedChat[]
  sendGameChat: typeof sendGameChat
}

const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [chat, setChat] = useState('');

  // Sort chats by time
  const sortedChats = [...props.chats].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const handleChatUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChat(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    if (chat.trim() === '') return;
    props.sendGameChat(gameId, chat.trim());
    setChat('');
  };

  return (
    <div className="chat-container">
      <div className="scroll-wrapper">
        <div className="chat-box">
          {sortedChats.length > 0 ? (
            sortedChats.map((chatMsg) => (
              <ChatMessage chat={chatMsg} key={`${chatMsg.userId}_${chatMsg.time}`} />
            ))
          ) : (
            <div className="empty-chat">
              <p>No messages yet</p>
              <p className="empty-hint">Be the first to start the conversation!</p>
            </div>
          )}
        </div>
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={chat}
          onChange={handleChatUpdate}
          aria-label="Chat message"
        />
        <div
          className="chat-send"
          onClick={handleSubmit}
          role="button"
          aria-label="Send message"
        >
          Send
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
