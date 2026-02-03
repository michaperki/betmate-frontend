import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchGameById } from 'store/actionCreators/gameActionCreators';

/**
 * Custom hook to poll for updated odds data
 * @param gameId - The ID of the current game
 * @param tournamentId - Optional tournament ID
 * @param roundId - Optional round ID
 * @param interval - Polling interval in ms (default: 10000)
 */
const useOddsPolling = (
  gameId: string,
  tournamentId?: string,
  roundId?: string,
  interval = 10000,
) => {
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!gameId) return;

    // Initial fetch
    dispatch(fetchGameById(gameId));

    const pollTimer = setInterval(() => {
      if (isPolling) {
        dispatch(fetchGameById(gameId));
      }
    }, interval);

    // Clean up
    return () => {
      clearInterval(pollTimer);
    };
  }, [gameId, tournamentId, roundId, interval, isPolling, dispatch]);

  // Method to manually stop/start polling
  const togglePolling = () => setIsPolling((prev) => !prev);
  const startPolling = () => setIsPolling(true);
  const stopPolling = () => setIsPolling(false);

  return {
    isPolling,
    error,
    togglePolling,
    startPolling,
    stopPolling,
  };
};

export default useOddsPolling;
