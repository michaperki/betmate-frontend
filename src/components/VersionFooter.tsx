import React from 'react';
import VersionTag from './VersionTag';
import './version-footer.scss';

const VersionFooter: React.FC = () => {
  return (
    <div className="version-footer" aria-hidden="false">
      <VersionTag />
    </div>
  );
};

export default VersionFooter;

