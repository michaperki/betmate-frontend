import joi from 'joi';
import { LeaderboardSection, Rank } from 'types/leaderboard';

// Default values for missing fields to prevent validation errors
const defaultRank: Partial<Rank> = {
  user_name: '',
};

// Schema without strict validation
export const RankSchema = joi.object<Rank>({
  user_id: joi.string().required(),
  user_name: joi.string().allow('').default('Player'),
  rank: joi.number().min(0).required(),
  winnings: joi.number().required(),
}).unknown(true);

// Schema for validation with fallbacks for missing data
export const LeaderboardSchema = joi.object<LeaderboardSection>({
  _id: joi.string().required(),
  rankings: joi.array().items(RankSchema).required(),
  rankings_size: joi.number().min(0).required(),
}).unknown(true);

// Helper function to sanitize data before validation
export const sanitizeLeaderboardData = (data: any): LeaderboardSection => {
  if (!data) {
    return { _id: 'unknown', rankings: [], rankings_size: 0 };
  }

  // Ensure rankings is an array and has default values
  const rankings = Array.isArray(data.rankings)
    ? data.rankings.map((rank: any) => ({
      user_id: rank?.user_id || 'unknown',
      user_name: rank?.user_name ? rank.user_name : `Player ${rank?.rank || 1}`,
      rank: rank?.rank || 1,
      winnings: rank?.winnings || 0,
    }))
    : [];

  return {
    _id: data._id || 'unknown',
    rankings,
    rankings_size: data.rankings_size || rankings.length,
  };
};
