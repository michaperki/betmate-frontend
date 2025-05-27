import React, { useEffect } from 'react';
import {
  RaffleDraw,
  RaffleHistory,
  RafflePeriod,
  RaffleDrawStatus,
  PrizeType
} from 'types/resources/raffle';

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

  const getStatusBadgeClass = (status: RaffleDrawStatus) => {
    switch (status) {
      case 'UPCOMING': return 'badge--secondary';
      case 'ACTIVE': return 'badge--success';
      case 'DRAWING': return 'badge--warning';
      case 'COMPLETED': return 'badge--secondary';
      default: return 'badge--secondary';
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
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="loading loading--lg">
          <div className="loading__spinner"></div>
          <div className="loading__text">Loading raffles...</div>
        </div>
      </div>
    );
  }

  if (error && currentRaffles.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="card text-center">
          <div className="card__body">
            <p className="text-error mb-4">Error loading raffles: {error}</p>
            <button onClick={fetchCurrentRaffles} className="btn btn--primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">Raffle Dashboard</h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto">
          Enter raffles using your coins for a chance to win prizes! Same coins you use for betting.
        </p>
      </div>

      {/* Current Raffles */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-primary mb-6">Current Raffles</h2>
        {currentRaffles.length === 0 ? (
          <div className="card text-center">
            <div className="card__body">
              <p className="text-muted">No active raffles at the moment</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {currentRaffles.map((raffle) => (
              <div key={raffle.id} className="card card--elevated">
                <div className="card__header">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-primary">
                      {getPeriodLabel(raffle.period)} Raffle
                    </div>
                    <div className={`badge ${getStatusBadgeClass(raffle.status)}`}>
                      {getStatusLabel(raffle.status)}
                    </div>
                  </div>
                </div>

                <div className="card__body">
                  <div className="flex justify-between mb-4 p-4 bg-tertiary rounded">
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase mb-1">Ends</div>
                      <div className="text-sm font-medium text-primary">
                        {formatDate(raffle.endDate)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase mb-1">Cutoff</div>
                      <div className="text-sm font-medium text-primary">
                        {formatDate(raffle.cutoffDate)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-tertiary rounded">
                      <div className="text-lg font-bold text-brand">
                        {raffle.totalParticipants}
                      </div>
                      <div className="text-xs text-muted uppercase">Participants</div>
                    </div>
                    <div className="text-center p-3 bg-tertiary rounded">
                      <div className="text-lg font-bold text-brand">
                        {raffle.totalTickets.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted uppercase">Total Tickets</div>
                    </div>
                    <div className="text-center p-3 bg-tertiary rounded">
                      <div className="text-lg font-bold text-brand">
                        {raffle.userTickets}
                      </div>
                      <div className="text-xs text-muted uppercase">Your Tickets</div>
                    </div>
                  </div>

                  {raffle.prizes && raffle.prizes.length > 0 && (
                    <div className="mb-4 p-4 bg-tertiary rounded">
                      <h4 className="text-sm font-semibold text-primary mb-3">Prizes:</h4>
                      <div className="flex flex-col gap-2">
                        {raffle.prizes.map((prize, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-primary rounded">
                            <span className="font-semibold text-brand text-base">{prize.value}</span>
                            <span className="text-xs text-muted uppercase">{formatPrizeType(prize.type)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card__footer text-center">
                  {canOptIn(raffle) ? (
                    <button
                      className={`btn btn--primary w-full ${optInLoading ? 'btn--loading' : ''}`}
                      onClick={() => handleOptIn(raffle.id)}
                      disabled={optInLoading}
                    >
                      {optInLoading ? 'Joining...' : 'Join Raffle'}
                    </button>
                  ) : raffle.userTickets > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-success font-semibold">
                      <span>✓</span>
                      <span>You're in! ({raffle.userTickets} tickets)</span>
                    </div>
                  ) : (
                    <div className="text-muted italic">
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
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Raffle History</h2>
        {raffleHistory.length === 0 ? (
          <div className="card text-center">
            <div className="card__body">
              <p className="text-muted">No raffle history available</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {raffleHistory.map((raffle) => (
                <div key={raffle.id} className="card">
                  <div className="card__header">
                    <div className="flex justify-between items-center">
                      <div className="text-base font-semibold text-primary">
                        {getPeriodLabel(raffle.period)} Raffle
                      </div>
                      <div className="text-sm text-secondary">
                        Drawn {formatDate(raffle.drawnAt)}
                      </div>
                    </div>
                  </div>

                  <div className="card__body">
                    <div className="flex gap-6 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-brand">
                          {raffle.totalTickets.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted uppercase">Total Tickets</div>
                      </div>
                      {raffle.userParticipated && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-brand">
                            {raffle.userTickets}
                          </div>
                          <div className="text-xs text-muted uppercase">Your Tickets</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-3">Winners:</h4>
                      {raffle.winners.length === 0 ? (
                        <div className="text-muted italic">No winners</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {raffle.winners.map((winner, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-tertiary rounded">
                              <span className="font-medium text-primary">
                                {winner.username}
                              </span>
                              <span className="text-sm text-brand">
                                {winner.prizeValue} {winner.prizeType.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {historyPagination.hasMore && (
              <div className="text-center mt-6">
                <button
                  className={`btn btn--secondary ${loading ? 'btn--loading' : ''}`}
                  onClick={loadMoreHistory}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default RaffleDashboard;