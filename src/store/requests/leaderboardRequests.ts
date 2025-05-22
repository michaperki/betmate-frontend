import { getBearerTokenHeader } from 'store/actionCreators';
import { createBackendAxiosRequest } from 'store/requests';
import { LeaderboardSection, Rank } from 'types/leaderboard';
import { RequestReturnType } from 'types/state';
import { validateSchema } from 'validation';
import { LeaderboardSchema, RankSchema, sanitizeLeaderboardData } from 'validation/leaderboard';

export const getLeaderboardSection = async (start: number, end: number, id?: string): Promise<RequestReturnType<LeaderboardSection>> => {
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
};

export const getLeaderboardRank = async (): Promise<RequestReturnType<Rank>> => {
  const result = await createBackendAxiosRequest<Rank>({
    method: 'GET',
    url: '/leaderboard/userrank',
    headers: getBearerTokenHeader(),
  });

  try {
    // We don't need to add a default user_name anymore
    // Let the component handle the display logic
    return validateSchema(RankSchema, result, (d) => d.data);
  } catch (error) {
    console.error('Error validating rank data:', error);
    // Return placeholder data if validation fails
    return {
      ...result,
      data: {
        user_id: result.data?.user_id || 'unknown',
        user_name: result.data?.user_name || `Player ${result.data?.rank || 0}`,
        rank: result.data?.rank || 0,
        winnings: result.data?.winnings || 0
      }
    };
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
