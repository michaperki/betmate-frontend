import React, { useEffect } from 'react';
import {
  RaffleDraw,
  RaffleHistory,
  RafflePeriod,
  RaffleDrawStatus,
  PrizeType
} from 'types/resources/raffle';
import './style.scss';

interface RaffleDashboardProps {
  currentRaffles: RaffleDraw[];
  raffleHistory: RaffleHistory[];
  loading: boolean;
  error: string | null;
  optInLoading: boolean;
  historyPagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  fetchCurrentRaffles: () => void;
  fetchRaffleHistory: (page?: number, limit?: number) => void;
  optInToRaffle: (drawId: string) => void;
}

const RaffleDashboard: React.FC<RaffleDashboardProps> = ({
  currentRaffles,
  raffleHistory,
  loading,
  error,
  optInLoading,
  historyPagination,
  fetchCurrentRaffles,
  fetchRaffleHistory,
  optInToRaffle,
}) => {
  useEffect(() => {
    fetchCurrentRaffles();
    fetchRaffleHistory();
  }, [fetchCurrentRaffles, fetchRaffleHistory]);

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

  const getStatusLabel = (status: RaffleDrawStatus) => {
    switch (status) {
      case 'UPCOMING': return 'Upcoming';
      case 'ACTIVE': return 'Active';
      case 'DRAWING': return 'Drawing';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  const getStatusClass = (status: RaffleDrawStatus) => {
    switch (status) {
      case 'UPCOMING': return 'upcoming';
      case 'ACTIVE': return 'active';
      case 'DRAWING': return 'drawing';
      case 'COMPLETED': return 'completed';
      default: return '';
    }
  };

  const formatPrizeType = (type: PrizeType) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const canOptIn = (raffle: RaffleDraw) => {
    const now = new Date();
    const cutoff = new Date(raffle.cutoffDate);
    return (
      (raffle.status === 'ACTIVE' || raffle.status === 'UPCOMING') &&
      now < cutoff &&
      raffle.userTickets === 0
    );
  };

  const handleOptIn = (drawId: string) => {
    if (!optInLoading) {
      optInToRaffle(drawId);
    }
  };

  const loadMoreHistory = () => {
    if (historyPagination.hasMore && !loading) {
      fetchRaffleHistory(historyPagination.page + 1);
    }
  };

  if (loading && currentRaffles.length === 0) {
    return (
      <div className="raffle-dashboard">
        <div className="raffle-dashboard__loading">Loading raffles...</div>
      </div>
    );
  }

  if (error && currentRaffles.length === 0) {
    return (
      <div className="raffle-dashboard">
        <div className="raffle-dashboard__error">
          Error loading raffles: {error}
          <button onClick={fetchCurrentRaffles} className="raffle-dashboard__retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="raffle-dashboard">
      <div className="raffle-dashboard__header">
        <h1 className="raffle-dashboard__title">Raffle Dashboard</h1>
        <p className="raffle-dashboard__subtitle">
          Enter raffles using your coins for a chance to win prizes! Same coins you use for betting.
        </p>
      </div>

      {/* Current Raffles */}
      <section className="raffle-dashboard__current">
        <h2 className="raffle-dashboard__section-title">Current Raffles</h2>
        {currentRaffles.length === 0 ? (
          <div className="raffle-dashboard__empty">
            No active raffles at the moment
          </div>
        ) : (
          <div className="raffle-dashboard__raffles">
            {currentRaffles.map((raffle) => (
              <div key={raffle.id} className="raffle-card">
                <div className="raffle-card__header">
                  <div className="raffle-card__period">
                    {getPeriodLabel(raffle.period)} Raffle
                  </div>
                  <div className={`raffle-card__status ${getStatusClass(raffle.status)}`}>
                    {getStatusLabel(raffle.status)}
                  </div>
                </div>

                <div className="raffle-card__dates">
                  <div className="raffle-card__date">
                    <span className="raffle-card__date-label">Ends:</span>
                    <span className="raffle-card__date-value">
                      {formatDate(raffle.endDate)}
                    </span>
                  </div>
                  <div className="raffle-card__date">
                    <span className="raffle-card__date-label">Cutoff:</span>
                    <span className="raffle-card__date-value">
                      {formatDate(raffle.cutoffDate)}
                    </span>
                  </div>
                </div>

                <div className="raffle-card__stats">
                  <div className="raffle-card__stat">
                    <span className="raffle-card__stat-value">
                      {raffle.totalParticipants}
                    </span>
                    <span className="raffle-card__stat-label">Participants</span>
                  </div>
                  <div className="raffle-card__stat">
                    <span className="raffle-card__stat-value">
                      {raffle.totalTickets.toLocaleString()}
                    </span>
                    <span className="raffle-card__stat-label">Total Tickets</span>
                  </div>
                  <div className="raffle-card__stat">
                    <span className="raffle-card__stat-value">
                      {raffle.userTickets}
                    </span>
                    <span className="raffle-card__stat-label">Your Tickets</span>
                  </div>
                </div>

                {raffle.prizes && raffle.prizes.length > 0 && (
                  <div className="raffle-card__prizes">
                    <h4 className="raffle-card__prizes-title">Prizes:</h4>
                    <div className="raffle-card__prizes-list">
                      {raffle.prizes.map((prize, index) => (
                        <div key={index} className="raffle-card__prize">
                          <span className="raffle-card__prize-value">{prize.value}</span>
                          <span className="raffle-card__prize-type">{formatPrizeType(prize.type)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="raffle-card__actions">
                  {canOptIn(raffle) ? (
                    <button
                      className="raffle-card__opt-in"
                      onClick={() => handleOptIn(raffle.id)}
                      disabled={optInLoading}
                    >
                      {optInLoading ? 'Joining...' : 'Join Raffle'}
                    </button>
                  ) : raffle.userTickets > 0 ? (
                    <div className="raffle-card__joined">
                      ✓ You're in! ({raffle.userTickets} tickets)
                    </div>
                  ) : (
                    <div className="raffle-card__cannot-join">
                      Registration closed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Raffle History */}
      <section className="raffle-dashboard__history">
        <h2 className="raffle-dashboard__section-title">Raffle History</h2>
        {raffleHistory.length === 0 ? (
          <div className="raffle-dashboard__empty">
            No raffle history available
          </div>
        ) : (
          <>
            <div className="raffle-dashboard__history-list">
              {raffleHistory.map((raffle) => (
                <div key={raffle.id} className="history-card">
                  <div className="history-card__header">
                    <div className="history-card__period">
                      {getPeriodLabel(raffle.period)} Raffle
                    </div>
                    <div className="history-card__date">
                      Drawn {formatDate(raffle.drawnAt)}
                    </div>
                  </div>

                  <div className="history-card__stats">
                    <div className="history-card__stat">
                      <span className="history-card__stat-value">
                        {raffle.totalTickets.toLocaleString()}
                      </span>
                      <span className="history-card__stat-label">Total Tickets</span>
                    </div>
                    {raffle.userParticipated && (
                      <div className="history-card__stat">
                        <span className="history-card__stat-value">
                          {raffle.userTickets}
                        </span>
                        <span className="history-card__stat-label">Your Tickets</span>
                      </div>
                    )}
                  </div>

                  <div className="history-card__winners">
                    <h4 className="history-card__winners-title">Winners:</h4>
                    {raffle.winners.length === 0 ? (
                      <div className="history-card__no-winners">No winners</div>
                    ) : (
                      <div className="history-card__winners-list">
                        {raffle.winners.map((winner, index) => (
                          <div key={index} className="history-card__winner">
                            <span className="history-card__winner-name">
                              {winner.username}
                            </span>
                            <span className="history-card__winner-prize">
                              {winner.prizeValue} {winner.prizeType.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {historyPagination.hasMore && (
              <button
                className="raffle-dashboard__load-more"
                onClick={loadMoreHistory}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default RaffleDashboard;