/* eslint-disable no-constant-condition */
// Server URL for making backend requests
// eslint-disable-next-line no-nested-ternary
export const ROOT_URL = process.env.TARGET_ENV === 'prod'
  ? 'https://betmate-c5e3b1b52828.herokuapp.com'
  : process.env.TARGET_ENV === 'dev'
    ? 'https://betmate-c5e3b1b52828.herokuapp.com'
    : 'http://localhost:9090';

// Auth token name for storage and transmission to backend
export const authTokenName = 'authToken';

// Number of ms before an axios request times out
export const requestTimeout = 3000;
