import React, { useState } from 'react';
import './style.scss';

interface TabPanelProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
    badgeCount?: number;
  }[];
  defaultTabId?: string;
  className?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ 
  tabs, 
  defaultTabId,
  className = ''
}) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
  };

  // If no tabs, render nothing
  if (tabs.length === 0) return null;

  // Find the active tab content
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  return (
    <div className={`tab-panel ${className}`}>
      <div className="tab-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
              <span className="tab-badge">{tab.badgeCount}</span>
            )}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab.content}
      </div>
    </div>
  );
};

export default TabPanel;