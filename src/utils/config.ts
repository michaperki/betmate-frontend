export const moveOptionColors = ['#00B6FF', '#64FF8F', '#FFC702', '#FF00B7'];

// Feature flags and environment-driven toggles
// Disable global leaderboard endpoints by default in production builds,
// unless explicitly overridden via DISABLE_GLOBAL_LEADERBOARD.
const RAW_DISABLE_GL = process.env.DISABLE_GLOBAL_LEADERBOARD;
const IS_PROD_TARGET = process.env.TARGET_ENV === 'prod' || process.env.NODE_ENV === 'production';
export const DISABLE_GLOBAL_LEADERBOARD = (
  RAW_DISABLE_GL === 'true'
  || (RAW_DISABLE_GL == null && IS_PROD_TARGET)
);
