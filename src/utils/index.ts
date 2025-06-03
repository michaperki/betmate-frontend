/* eslint-disable no-constant-condition */
// Server URL for making backend requests
// eslint-disable-next-line no-nested-ternary
export const ROOT_URL = process.env.TARGET_ENV === 'prod'
  ? 'https://betmate-prod-1d67bb013aa8.herokuapp.com'
  : process.env.TARGET_ENV === 'dev'
    ? 'https://betmate-staging-b13c28d0322d.herokuapp.com'
    : 'http://localhost:9000';

// Auth token name for storage and transmission to backend
export const authTokenName = 'authToken';

// Number of ms before an axios request times out
export const requestTimeout = 3000;

// Export all utilities
export * as chess from './chess';
export * as leaderboard from './leaderboard';
export { default as logger } from './logger';
export * from './error';
export * from './config';
