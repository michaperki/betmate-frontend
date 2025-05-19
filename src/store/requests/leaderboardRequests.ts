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
    // Add default user_name if missing
    if (result.data && !result.data.user_name) {
      result.data.user_name = 'Unknown User';
    }
    return validateSchema(RankSchema, result, (d) => d.data);
  } catch (error) {
    console.error('Error validating rank data:', error);
    // Return placeholder data if validation fails
    return {
      ...result,
      data: {
        user_id: result.data?.user_id || 'unknown',
        user_name: 'Unknown User',
        rank: result.data?.rank || 0,
        winnings: result.data?.winnings || 0
      }
    };
  }
};
