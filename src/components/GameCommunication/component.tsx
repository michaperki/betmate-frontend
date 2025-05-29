import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import TabPanel from '../TabPanel';
import ChatBox from '../ChatBox';
import WagerReceipts from '../WagerReceipts';
import { Wager } from 'types/resources/wager';
import { FeedChat } from 'types/resources/game';
import './style.scss';

interface GameCommunicationProps {
  resolvedWagers: Wager[];
  chats: FeedChat[];
  className?: string;
}

const GameCommunication: React.FC<GameCommunicationProps> = ({
  resolvedWagers,
  chats,
  className = ''
}) => {
  // Get gameId at the top level
  const { id: gameId } = useParams<{ id: string }>();

  // Count of active wagers for badge - only count for current game
  const activeWagerCount = useMemo(() => {
    // Get only unique wagers for this game that are still pending
    return new Set(
      resolvedWagers
        .filter(wager => wager.game_id === gameId && !wager.resolved)
        .map(wager => wager._id)
    ).size;
  }, [resolvedWagers, gameId]);

  // Count of chats for badge - only count for current game
  const chatCount = useMemo(() => {
    return chats.filter(chat => chat.gameId === gameId).length;
  }, [chats, gameId]);

  return (
    <div className={`game-communication ${className}`}>
      <TabPanel
        tabs={[
          {
            id: 'wagers',
            label: 'Wager Receipts',
            content: (
              <WagerReceipts />
            ),
            badgeCount: activeWagerCount
          },
          {
            id: 'chat',
            label: 'Chat',
            content: (
              <ChatBox />
            ),
            badgeCount: chatCount
          }
        ]}
        defaultTabId="wagers"
      />
    </div>
  );
};

export default GameCommunication;