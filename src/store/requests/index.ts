import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { requestTimeout, ROOT_URL } from 'utils/index';
import { RequestReturnType } from 'types/state';

// Simple, in-memory cooldowns for select endpoints
let analysisBlockedUntil = 0;
let authBlockedUntil = 0;

export const isAnalysisRateLimited = (): boolean => Date.now() < analysisBlockedUntil;
export const isAuthRateLimited = (): boolean => Date.now() < authBlockedUntil;

// Dedicated axios instance for backend calls
const backendAxios = axios.create({
  baseURL: `${ROOT_URL}/`,
  timeout: requestTimeout,
});

// Response interceptor to honor 429s with short cooldowns
backendAxios.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err) => {
    try {
      const status = err?.response?.status;
      const url: string = err?.config?.url || '';
      if (status === 429) {
        if (url.startsWith('/analysis')) {
          analysisBlockedUntil = Date.now() + 5000; // 5s cooldown for analysis
        } else if (url.startsWith('/auth/jwt-signin')) {
          authBlockedUntil = Date.now() + 10000; // 10s cooldown for jwt-signin
        }
      }
    } catch {}
    return Promise.reject(err);
  },
);

export const createBackendAxiosRequest = async <D>(
  config: AxiosRequestConfig,
): Promise<RequestReturnType<D>> => {
  const url = String(config.url || '');

  // Short-circuit when recently rate-limited
  if (url.startsWith('/analysis') && isAnalysisRateLimited()) {
    return Promise.reject(new Error('Rate limited: analysis cooldown')) as any;
  }
  if (url.startsWith('/auth/jwt-signin') && isAuthRateLimited()) {
    return Promise.reject(new Error('Rate limited: auth cooldown')) as any;
  }

  return backendAxios.request<D>({
    ...config,
  });
};

export * from './analysisRequests';
export * from './marketRequests';
// raffle requests removed
