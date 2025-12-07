import React from 'react';
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
    </span>
  );
};

export default VersionTag;
