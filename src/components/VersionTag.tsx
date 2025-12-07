import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { versionLabel, buildTimeISO } from '../version';

interface VersionTagProps {
  className?: string;
  ariaLabelPrefix?: string;
}

const VersionTag: React.FC<VersionTagProps> = ({ className = '', ariaLabelPrefix = 'App version' }) => {
  return (
    <span
      className={`version-tag ${className}`.trim()}
      title={`Built ${new Date(buildTimeISO).toLocaleString()}`}
      aria-label={`${ariaLabelPrefix} ${versionLabel}`}
    >
      {versionLabel}
      <span className="version-tag__sep" aria-hidden="true"> • </span>
      <a
        href="https://discord.gg/QpqZ5d3C"
        target="_blank"
        rel="noopener noreferrer"
        className="version-tag__link"
        aria-label="Join our Discord"
      >
        <FontAwesomeIcon icon={faDiscord} className="version-tag__icon" title="Join Discord" />
      </a>
    </span>
  );
};

export default VersionTag;
