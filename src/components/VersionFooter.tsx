import React, { useState } from 'react';
import './version-footer.scss';
import ReportIssue from 'components/ReportIssue';

const VersionFooter: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="version-footer" aria-hidden="false">
      <span className="version-tag" aria-label="Frontend build">Frontend</span>
      <span style={{ marginLeft: 8, opacity: 0.6 }}>•</span>
      <a href="/how-betting-works" className="version-tag__link" style={{ marginLeft: 8 }}>How Betting Works</a>
      <span style={{ marginLeft: 8, opacity: 0.6 }}>•</span>
      <a href="/faq" className="version-tag__link" style={{ marginLeft: 8 }}>FAQ</a>
      <span style={{ marginLeft: 8, opacity: 0.6 }}>•</span>
      <a href="/terms" className="version-tag__link" style={{ marginLeft: 8 }}>Terms</a>
      <span style={{ marginLeft: 8, opacity: 0.6 }}>•</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="version-tag__link"
        style={{ marginLeft: 8 }}
        aria-label="Report an issue"
      >
        Report Issue
      </button>
      <ReportIssue isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default VersionFooter;
