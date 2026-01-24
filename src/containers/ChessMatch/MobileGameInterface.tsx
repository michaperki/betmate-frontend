import React, { useState } from 'react';
import CollapsibleSection from '../../components/CollapsibleSection';
import './mobile-game-interface.scss';

interface MobileGameInterfaceProps {
  boardSection: React.ReactNode;
  moveTilesSection: React.ReactNode;
  notationSection: React.ReactNode;
  receiptsSection: React.ReactNode;
  newReceiptsCount?: number;
}

const MobileGameInterface: React.FC<MobileGameInterfaceProps> = ({
  boardSection,
  moveTilesSection,
  notationSection,
  receiptsSection,
  newReceiptsCount = 0,
}) => {
  const [activeSection, setActiveSection] = useState<'board' | 'moves' | 'notation' | 'receipts'>('board');

  // Check if the device is in portrait mode (height > width)
  const isPortrait = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true;

  // In landscape mode, show a side-by-side view with fixed sections
  if (!isPortrait) {
    return (
      <div className="mobile-game-landscape">
        <div className="landscape-main">
          {boardSection}
        </div>
        <div className="landscape-sidebar">
          <CollapsibleSection 
            title="Move Options" 
            initiallyExpanded={true}
            className="landscape-section"
          >
            {moveTilesSection}
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Notation" 
            initiallyExpanded={true}
            className="landscape-section"
          >
            {notationSection}
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Wager Receipts" 
            initiallyExpanded={false}
            className="landscape-section"
            badgeCount={newReceiptsCount}
          >
            {receiptsSection}
          </CollapsibleSection>
        </div>
      </div>
    );
  }

  // In portrait mode, use collapsible sections
  return (
    <div className="mobile-game-portrait">
      {/* Board is always visible */}
      <div className="portrait-board-container">
        {boardSection}
      </div>

      {/* Move tiles are shown below the board */}
      <div className="portrait-moves-container">
        {moveTilesSection}
      </div>

      {/* Collapsible sections for notation and receipts */}
      <div className="portrait-collapsible-sections">
        <CollapsibleSection 
          title="Game Notation" 
          initiallyExpanded={false}
          className="portrait-section"
        >
          <div className="notation-container">
            {notationSection}
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection 
          title="Wager Receipts" 
          initiallyExpanded={false}
          className="portrait-section"
          badgeCount={newReceiptsCount}
        >
          <div className="receipts-container">
            {receiptsSection}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default MobileGameInterface;