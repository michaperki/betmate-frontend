import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { requestTimeout, ROOT_URL } from 'utils/index';
import { getBearerTokenHeader } from 'store/actionCreators';
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
  // Always include credentials; harmless for bearer flows, required if cookies are used
  withCredentials: true,
});

// Attach a lightweight X-Request-Id to every request (backend will echo it and propagate downstream)
backendAxios.interceptors.request.use((config) => {
  try {
    const headers = config.headers || {};
    const existing = (headers as any)['X-Request-Id'] || (headers as any)['x-request-id'];
    const rid = existing || `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    (headers as any)['X-Request-Id'] = String(rid);
    // Force-attach Authorization header when a token exists (belt-and-suspenders)
    try {
      const bearer = getBearerTokenHeader();
      if (bearer && (bearer as any).Authorization) {
        (headers as any).Authorization = (bearer as any).Authorization;
        // Some environments normalize headers to lowercase; set both to be safe
        (headers as any).authorization = (bearer as any).Authorization;
      }
    } catch {}
    config.headers = headers;
    try { (window as any).__bmLastRequestId = rid; } catch {}
  } catch {}
  return config;
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

  // Safety net: ensure resend-verification always carries auth + email
  if (url.startsWith('/auth/resend-verification')) {
    try {
      const headers = { ...(config.headers || {}) } as any;
      const bearer = getBearerTokenHeader();
      if (bearer && (bearer as any).Authorization) {
        headers.Authorization = (bearer as any).Authorization;
        headers.authorization = (bearer as any).Authorization;
      }
      // Auto-fill email body if missing
      let data: any = config.data;
      if (!data || typeof data !== 'object' || !('email' in data) || !data.email) {
        try {
          const e = (window && (window as any).store?.getState?.()?.auth?.user?.email) || undefined;
          const localEmail = ((): string | undefined => {
            try { return (localStorage.getItem('authEmail') || undefined) as any; } catch { return undefined; }
          })();
          const email = e || localEmail;
          if (email) data = { ...(data && typeof data === 'object' ? data : {}), email };
        } catch {}
      }
      config = { ...config, headers, data };
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[resend-verification] enforced headers/body', { hasAuth: !!headers.Authorization, dataKeys: data && typeof data === 'object' ? Object.keys(data) : [] });
      }
    } catch {}
  }

  return backendAxios.request<D>({
    ...config,
  });
};

export * from './analysisRequests';
export * from './marketRequests';
// raffle requests removed
