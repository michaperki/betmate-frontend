import { createBackendAxiosRequest } from '.';
import { getBearerTokenHeader } from 'store/actionCreators';
import { FAUCET_ADMIN_KEY } from 'utils/config';

const adminHeaders = () => ({
  ...getBearerTokenHeader(),
  ...(FAUCET_ADMIN_KEY ? { 'X-Admin-Key': FAUCET_ADMIN_KEY } : {}),
});

export const getRiskConfig = async () => (
  createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/risk/config', headers: adminHeaders() })
);

export const updateRiskConfig = async (patch: any) => (
  createBackendAxiosRequest<any>({ method: 'PUT', url: '/admin/risk/config', data: patch, headers: adminHeaders() })
);

export const getGlobalExposure = async () => (
  createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/exposure/global', headers: adminHeaders() })
);

export const getGameExposure = async (gameId: string) => (
  createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/exposure/games/${gameId}`, headers: adminHeaders() })
);

export const resetRiskOverrides = async () => (
  createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/risk/reset', headers: adminHeaders() })
);

export const clearAllWagers = async () => (
  createBackendAxiosRequest<{ ok: boolean; deleted: number }>({ method: 'POST', url: '/admin/dev/clear-wagers', headers: adminHeaders() })
);

// Feature flags (DB-backed)
export const getAdminFeatures = async () => {
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/features', headers: adminHeaders() });
  return res.data;
};

export const updateAdminFeatures = async (patch: any) => {
  const res = await createBackendAxiosRequest<any>({ method: 'PUT', url: '/admin/features', data: patch, headers: adminHeaders() });
  return res.data;
};

export const getAdminHome = async () => {
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/home', headers: adminHeaders() });
  return res.data;
};

export const getAdminDeposits = async ({ status, since, limit }: { status?: string; since?: string; limit?: number; }) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (since) params.set('since', since);
  if (limit) params.set('limit', String(limit));
  try {
    const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/wallet/deposits?${params.toString()}`, headers: adminHeaders() });
    return res.data;
  } catch (e: any) {
    // Fallback for local dev if admin route not present yet: show current user's deposits
    const me = await createBackendAxiosRequest<any>({ method: 'GET', url: '/billing/deposits', headers: adminHeaders() });
    return { deposits: me?.data || [] };
  }
};

export const clearStaleInvoices = async (olderThanMinutes: number) => {
  const res = await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/dev/clear-stale-invoices', data: { olderThanMinutes }, headers: adminHeaders() });
  return res.data;
};

export const applyRiskPreset = async (level: 'low'|'med'|'high') => {
  const res = await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/risk/preset', data: { level }, headers: adminHeaders() });
  return res.data;
};

export const getOpsStats = async () => {
  try {
    const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/ops/stats', headers: adminHeaders() });
    return res.data;
  } catch (e) {
    // Fallback to /admin/home health block if ops route not present yet
    try {
      const home = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/home', headers: adminHeaders() });
      const h = home.data?.health || {};
      return { db: h.db || 'unknown', rateLimitCounters: { analysis429: 0, auth429: 0, billingIntent429: 0 } };
    } catch {
      throw e;
    }
  }
};

export const pingMicroservice = async () => {
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/ops/ping', headers: adminHeaders() });
  return res.data;
};

export const clearStaleWagers = async (olderThanMinutes: number) => {
  const res = await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/dev/clear-stale-wagers', data: { olderThanMinutes }, headers: adminHeaders() });
  return res.data;
};
