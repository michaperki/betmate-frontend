import React from 'react';
import RaffleDashboard from 'components/RaffleDashboard';
import NavBar from 'components/NavBar';
import './style.scss';

const RafflePage: React.FC = () => {
  return (
    <div className="raffle-page">
      <NavBar />
      <div className="raffle-page__content">
        <div className="raffle-page__container">
          <RaffleDashboard />
        </div>
      </div>
    </div>
  );
};

export default RafflePage;