import React, { ReactNode } from 'react';

import ConnectionStatus from 'components/ConnectionStatus';
import NavBar from 'components/NavBar';
import OnboardingGate from 'components/OnboardingGate';

interface AuthenticatedLayoutProps {
  isAuthenticated: boolean;
  children: ReactNode;
  className?: string;
  showCompactNav?: boolean;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  isAuthenticated,
  children,
  className = 'dark-game-page',
  showCompactNav = true,
}) => {
  return (
    <>
      <OnboardingGate isAuthenticated={isAuthenticated} />
      <div className={className}>
        <ConnectionStatus />
        <NavBar compact={showCompactNav} />
        {children}
      </div>
    </>
  );
};

export default AuthenticatedLayout;
