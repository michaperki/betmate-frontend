import React, { useEffect, useState } from 'react';
import { 
  RaffleDraw, 
  RafflePeriod,
  RaffleDrawStatus 
} from 'types/resources/raffle';

interface RaffleOptInProps {
  currentRaffles: RaffleDraw[];
  loading: boolean;
  error: string | null;
  optInLoading: boolean;
  tokenBalance: number;
  fetchCurrentRaffles: () => void;
  optInToRaffle: (drawId: string) => void;
}

const RaffleOptIn: React.FC<RaffleOptInProps> = ({
  currentRaffles,
  loading,
  error,
  optInLoading,
  tokenBalance,
  fetchCurrentRaffles,
  optInToRaffle,
}) => {
  const [selectedRaffle, setSelectedRaffle] = useState<string>('');

  useEffect(() => {
    fetchCurrentRaffles();
  }, [fetchCurrentRaffles]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodLabel = (period: RafflePeriod) => {
    return period === 'WEEKLY' ? 'Weekly' : 'Monthly';
  };

  const getAvailableRaffles = () => {
    const now = new Date();
    return currentRaffles.filter(raffle => {
      const cutoff = new Date(raffle.cutoffDate);
      return (
        (raffle.status === 'ACTIVE' || raffle.status === 'UPCOMING') &&
        now < cutoff &&
        raffle.userTickets === 0
      );
    });
  };

  const availableRaffles = getAvailableRaffles();
  const selectedRaffleData = availableRaffles.find(r => r.id === selectedRaffle);

  const handleOptIn = () => {
    if (selectedRaffle && !optInLoading) {
      optInToRaffle(selectedRaffle);
      setSelectedRaffle(''); // Reset selection after opt-in
    }
  };

  const canOptIn = () => {
    return (
      selectedRaffle &&
      tokenBalance > 0 &&
      !optInLoading &&
      selectedRaffleData
    );
  };

  if (loading) {
    return (
      <div className="raffle-opt-in">
        <div className="raffle-opt-in__loading">Loading raffles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="raffle-opt-in">
        <div className="raffle-opt-in__error">
          Error: {error}
          <button onClick={fetchCurrentRaffles} className="raffle-opt-in__retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (availableRaffles.length === 0) {
    return (
      <div className="raffle-opt-in">
        <div className="raffle-opt-in__empty">
          <h3>No Available Raffles</h3>
          <p>There are no raffles available for entry at the moment.</p>
          <button onClick={fetchCurrentRaffles} className="raffle-opt-in__refresh">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (tokenBalance === 0) {
    return (
      <div className="raffle-opt-in">
        <div className="raffle-opt-in__no-tokens">
          <h3>No Coins Available</h3>
          <p>You need coins to participate in raffles. Earn coins by playing games and placing successful bets!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="raffle-opt-in">
      <div className="raffle-opt-in__header">
        <h3 className="raffle-opt-in__title">Join a Raffle</h3>
        <div className="raffle-opt-in__balance">
          Your balance: <span className="raffle-opt-in__balance-value">{tokenBalance}</span> coins
        </div>
      </div>

      <div className="raffle-opt-in__form">
        <div className="raffle-opt-in__field">
          <label className="raffle-opt-in__label">Select Raffle:</label>
          <select
            className="raffle-opt-in__select"
            value={selectedRaffle}
            onChange={(e) => setSelectedRaffle(e.target.value)}
            disabled={optInLoading}
          >
            <option value="">Choose a raffle...</option>
            {availableRaffles.map((raffle) => (
              <option key={raffle.id} value={raffle.id}>
                {getPeriodLabel(raffle.period)} Raffle - Ends {formatDate(raffle.endDate)}
              </option>
            ))}
          </select>
        </div>

        {selectedRaffleData && (
          <div className="raffle-opt-in__details">
            <div className="raffle-opt-in__detail">
              <span className="raffle-opt-in__detail-label">Registration closes:</span>
              <span className="raffle-opt-in__detail-value">
                {formatDate(selectedRaffleData.cutoffDate)}
              </span>
            </div>
            <div className="raffle-opt-in__detail">
              <span className="raffle-opt-in__detail-label">Current participants:</span>
              <span className="raffle-opt-in__detail-value">
                {selectedRaffleData.totalParticipants}
              </span>
            </div>
            <div className="raffle-opt-in__detail">
              <span className="raffle-opt-in__detail-label">Total tickets:</span>
              <span className="raffle-opt-in__detail-value">
                {selectedRaffleData.totalTickets.toLocaleString()}
              </span>
            </div>
            <div className="raffle-opt-in__detail">
              <span className="raffle-opt-in__detail-label">Your tickets will be:</span>
              <span className="raffle-opt-in__detail-value raffle-opt-in__detail-value--highlight">
                {tokenBalance} tickets (1 coin = 1 ticket)
              </span>
            </div>
          </div>
        )}

        <button
          className="raffle-opt-in__submit"
          onClick={handleOptIn}
          disabled={!canOptIn()}
        >
          {optInLoading ? 'Joining...' : 'Join Raffle'}
        </button>

        {selectedRaffleData && (
          <div className="raffle-opt-in__info">
            <p className="raffle-opt-in__info-text">
              ℹ️ Your current balance ({tokenBalance} coins) will be converted to {tokenBalance} raffle tickets.
              One coin equals one ticket. These are the same coins you use for betting!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaffleOptIn;