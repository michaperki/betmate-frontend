import React, { useState, useEffect } from 'react';
import './style.scss';

interface DragDropTipProps {
  isAuthenticated: boolean;
}

const DragDropTip: React.FC<DragDropTipProps> = ({ isAuthenticated }) => {
  const [visible, setVisible] = useState(true);
  
  // Hide tip automatically after 10 seconds
  useEffect(() => {
    if (isAuthenticated && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, visible]);
  
  if (!isAuthenticated || !visible) {
    return null;
  }
  
  return (
    <div className="drag-drop-tip">
      <div className="tip-content">
        <div className="tip-header">
          <span className="tip-title">New Feature: Drag & Drop Betting</span>
          <button className="close-button" onClick={() => setVisible(false)}>×</button>
        </div>
        <p>Try our new drag-and-drop betting!</p>
        <p>Simply drag a piece to a square to place a bet on that move.</p>
      </div>
    </div>
  );
};

export default DragDropTip;