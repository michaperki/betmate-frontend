import React, { useState, useRef, useEffect } from 'react';
import './style.scss';

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  className?: string;
  badgeCount?: number;
  accessibilityLabel?: string;
  id?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initiallyExpanded = true,
  className = '',
  badgeCount = 0,
  accessibilityLabel,
  id,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>(initiallyExpanded ? 'auto' : 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const uniqueId = id || `collapsible-${Math.random().toString(36).substring(2, 9)}`;
  const contentId = `${uniqueId}-content`;
  const headerId = `${uniqueId}-header`;

  // Recalculate height when expanded state changes or children change
  useEffect(() => {
    if (!contentRef.current) return;

    if (isExpanded) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
      
      // After animation completes, set height to auto to accommodate content changes
      const timer = setTimeout(() => {
        setContentHeight('auto');
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // Briefly set height to scrollHeight to allow animation from current size to 0
      setContentHeight(contentRef.current.scrollHeight);
      
      // Force a reflow
      contentRef.current.scrollHeight;
      
      // Then set to 0 to animate the collapse
      setContentHeight(0);
    }
  }, [isExpanded, children]);

  const toggleExpanded = () => {
    if (!isExpanded) {
      // When expanding, first set height to scrollHeight for animation
      setContentHeight(contentRef.current?.scrollHeight || 0);
    }
    setIsExpanded(!isExpanded);
  };

  const classes = [
    'collapsible-section',
    isExpanded ? 'is-expanded' : 'is-collapsed',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} id={uniqueId}>
      <button
        className="collapsible-header"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        id={headerId}
        aria-label={accessibilityLabel || `${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
      >
        <span className="collapsible-title">{title}</span>
        {badgeCount > 0 && (
          <span className="collapsible-badge" aria-label={`${badgeCount} new items`}>
            {badgeCount}
          </span>
        )}
        <span className="collapsible-icon" aria-hidden="true">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      <div 
        className="collapsible-content"
        ref={contentRef}
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        style={{ 
          height: contentHeight === 'auto' ? 'auto' : `${contentHeight}px`,
          visibility: !isExpanded && contentHeight === 0 ? 'hidden' : 'visible'
        }}
      >
        <div className="collapsible-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;