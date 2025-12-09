export const moveOptionColors = ['#00B6FF', '#64FF8F', '#FFC702', '#FF00B7'];

// Feature flags and environment-driven toggles
// Disable global leaderboard endpoints when backend doesn't support them in this environment
export const DISABLE_GLOBAL_LEADERBOARD = (process.env.DISABLE_GLOBAL_LEADERBOARD === 'true');
