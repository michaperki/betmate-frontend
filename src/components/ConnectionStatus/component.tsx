import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import './style.scss';

interface ConnectionStatusProps {
  showDetails?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showDetails = false }) => {
  const { connectionState, reconnectAttempt, error } = useSelector((state: RootState) => state.socket);

  // Only render if we're not connected
  if (connectionState === 'connected') {
    return null;
  }
  
  let icon = '🔄'; // Default reconnecting icon
  let message = 'Connecting...';
  let className = 'connection-status connecting';
  
  switch (connectionState) {
    case 'disconnected':
      icon = '⚠️';
      message = 'Disconnected';
      className = 'connection-status disconnected';
      break;
    case 'connecting':
      icon = '🔄';
      message = 'Connecting...';
      className = 'connection-status connecting';
      break;
    case 'reconnecting':
      icon = '🔄';
      message = `Reconnecting (attempt ${reconnectAttempt})...`;
      className = 'connection-status reconnecting';
      break;
    case 'error':
      icon = '❌';
      message = 'Connection error';
      className = 'connection-status error';
      break;
  }

  return (
    <div className={className}>
      <span className="icon">{icon}</span>
      <span className="message">{message}</span>
      {showDetails && error && <span className="details">{error}</span>}
    </div>
  );
};

export default React.memo(ConnectionStatus);