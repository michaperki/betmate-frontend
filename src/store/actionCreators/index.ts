import { authTokenName } from 'utils/index';

export const getBearerToken = (): string | null => localStorage.getItem(authTokenName);

/**
 * Gets the site-stored authToken from localStorage and returns it in the form of an authorization header
 */
export const getBearerTokenHeader = (): Record<string, string> => {
  const t = getBearerToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/**
 * Sets a returned token in localStorage for attachment to later network requests
 * @param {*} token - A valid JWT authentication token
 */
export const setBearerToken = (token: string): void => {
  localStorage.setItem(authTokenName, token);
};

export const removeBearerToken = (): void => localStorage.removeItem(authTokenName);

// Persist last-known auth email for cases where a caller forgets to pass it
const authEmailName = 'authEmail';
export const getAuthEmail = (): string | null => {
  try { return localStorage.getItem(authEmailName); } catch { return null; }
};
export const setAuthEmail = (email: string | undefined | null): void => {
  try {
    if (email && typeof email === 'string') localStorage.setItem(authEmailName, email);
  } catch {}
};
export const removeAuthEmail = (): void => {
  try { localStorage.removeItem(authEmailName); } catch {}
};
