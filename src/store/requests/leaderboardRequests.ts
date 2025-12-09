import { getBearerTokenHeader } from 'store/actionCreators';
import { createBackendAxiosRequest } from 'store/requests';
import type { AxiosError } from 'axios';
import { LeaderboardSection, Rank, UserRankResponse } from 'types/leaderboard';
import { RequestReturnType } from 'types/state';
import { validateSchema } from 'validation';
import { LeaderboardSchema, RankSchema, sanitizeLeaderboardData } from 'validation/leaderboard';

// Simple in-memory backoff to avoid hammering routes that are unavailable in current environment
let leaderboardUnavailableUntil = 0;
const BACKOFF_MS = 5 * 60 * 1000; // 5 minutes

export const getLeaderboardSection = async (start: number, end: number, id?: string): Promise<RequestReturnType<LeaderboardSection>> => {
  // Respect backoff window
  if (Date.now() < leaderboardUnavailableUntil) {
    return {
      data: { _id: 'unavailable', rankings: [], rankings_size: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as unknown as RequestReturnType<LeaderboardSection>;
  }
  try {
    const result = await createBackendAxiosRequest<LeaderboardSection>({
      method: 'GET',
      url: '/leaderboard',
      params: { start, end, id },
    });

    // First sanitize the data, then validate it
    try {
      const sanitizedData = sanitizeLeaderboardData(result.data);

      // Replace the data with the sanitized version
      const updatedResult = {
        ...result,
        data: sanitizedData
      };

      return validateSchema(LeaderboardSchema, updatedResult, (d) => d.data);
    } catch (error) {
      console.error('Error sanitizing leaderboard data:', error);
      // Return the original result with empty rankings if validation fails
      return {
        ...result,
        data: { _id: result.data?._id || 'unknown', rankings: [], rankings_size: 0 }
      };
    }
  } catch (err) {
    const e = err as AxiosError<any>;
    const status = e?.response?.status;
    if (status === 404) {
      // Backend global leaderboard not available in this environment – return empty section
      leaderboardUnavailableUntil = Date.now() + BACKOFF_MS;
      return {
        data: { _id: 'unavailable', rankings: [], rankings_size: 0 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as unknown as RequestReturnType<LeaderboardSection>;
    }
    throw err;
  }
};

export const getLeaderboardRank = async (): Promise<RequestReturnType<UserRankResponse>> => {
  // Respect backoff window
  if (Date.now() < leaderboardUnavailableUntil) {
    return {
      data: { has_rank: false } as any,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as RequestReturnType<UserRankResponse>;
  }
  try {
    const result = await createBackendAxiosRequest<UserRankResponse>({
      method: 'GET',
      url: '/leaderboard/userrank',
      headers: getBearerTokenHeader(),
    });

    // If the backend indicates the user has no rank, pass that through without validation
    if ((result.data as any)?.has_rank === false) {
      return { ...result, data: { has_rank: false } } as RequestReturnType<UserRankResponse>;
    }

    try {
      // Validate normal Rank payloads
      return validateSchema(RankSchema, result as RequestReturnType<Rank>, (d) => d.data);
    } catch (error) {
      console.error('Error validating rank data:', error);
      // Return explicit no-rank if validation fails unexpectedly
      return { ...result, data: { has_rank: false } } as RequestReturnType<UserRankResponse>;
    }
  } catch (err) {
    const e = err as AxiosError<any>;
    const status = e?.response?.status;
    if (status === 404) {
      // Backend user rank not available – return no-rank shape
      leaderboardUnavailableUntil = Date.now() + BACKOFF_MS;
      return {
        data: { has_rank: false } as any,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as RequestReturnType<UserRankResponse>;
    }
    throw err;
  }
};

export const getGameLeaderboard = async (gameId: string): Promise<RequestReturnType<{ rankings: Rank[] }>> => {
  const result = await createBackendAxiosRequest<{ rankings: Rank[] }>({
    method: 'GET',
    url: `/leaderboard/game/${gameId}`,
  });

  try {
    // Validate each ranking in the array
    const validatedRankings = result.data.rankings.map(rank => {
      try {
        return validateSchema(RankSchema, { data: rank }, (d) => d.data).data;
      } catch (error) {
        console.error('Error validating individual rank:', error);
        return {
          user_id: rank.user_id || 'unknown',
          user_name: rank.user_name || `Player ${rank.rank || 0}`,
          rank: rank.rank || 0,
          winnings: rank.winnings || 0
        };
      }
    });

    return {
      ...result,
      data: { rankings: validatedRankings }
    };
  } catch (error) {
    console.error('Error validating game leaderboard data:', error);
    return {
      ...result,
      data: { rankings: [] }
    };
  }
};
