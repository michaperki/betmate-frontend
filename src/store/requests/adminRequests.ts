import { getBearerTokenHeader } from 'store/actionCreators';
import { FAUCET_ADMIN_KEY } from 'utils/config';
import { createBackendAxiosRequest } from '.';

const adminHeaders = () => ({
  ...getBearerTokenHeader(),
  ...(FAUCET_ADMIN_KEY ? { 'X-Admin-Key': FAUCET_ADMIN_KEY } : {}),
});

export const getRiskConfig = async () => (
  createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/risk/config', headers: adminHeaders() })
);

export const updateRiskConfig = async (patch: any) => (
  createBackendAxiosRequest<any>({
    method: 'PUT', url: '/admin/risk/config', data: patch, headers: adminHeaders(),
  })
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
  const res = await createBackendAxiosRequest<any>({
    method: 'PUT', url: '/admin/features', data: patch, headers: adminHeaders(),
  });
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
  const res = await createBackendAxiosRequest<any>({
    method: 'POST', url: '/admin/dev/clear-stale-invoices', data: { olderThanMinutes }, headers: adminHeaders(),
  });
  return res.data;
};

export const applyRiskPreset = async (level: 'beta' | 'low' | 'med' | 'high') => {
  const res = await createBackendAxiosRequest<any>({
    method: 'POST', url: '/admin/risk/preset', data: { level }, headers: adminHeaders(),
  });
  return res.data;
};

// Daily payment volume (for AdminHome KPIs)
export const getAdminPaymentVolumeDaily = async (days: number) => {
  const params = new URLSearchParams();
  if (days) params.set('days', String(days));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/wallet/volume/daily?${params.toString()}`, headers: adminHeaders() });
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
  const res = await createBackendAxiosRequest<any>({
    method: 'POST', url: '/admin/dev/clear-stale-wagers', data: { olderThanMinutes }, headers: adminHeaders(),
  });
  return res.data;
};

// Withdrawals (admin)
export const getAdminWithdrawals = async ({ status, since, limit }: { status?: string; since?: string; limit?: number; }) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (since) params.set('since', since);
  if (limit) params.set('limit', String(limit));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/wallet/withdrawals?${params.toString()}`, headers: adminHeaders() });
  return res.data;
};

export const approveWithdrawal = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/wallet/withdrawals/${id}/approve`, headers: adminHeaders() })).data
);
export const rejectWithdrawal = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/wallet/withdrawals/${id}/reject`, headers: adminHeaders() })).data
);
export const markWithdrawalProcessing = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/wallet/withdrawals/${id}/mark-processing`, headers: adminHeaders() })).data
);
export const markWithdrawalPaid = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/wallet/withdrawals/${id}/mark-paid`, headers: adminHeaders() })).data
);
export const markWithdrawalFailed = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/wallet/withdrawals/${id}/mark-failed`, headers: adminHeaders() })).data
);

// KYC admin APIs
export const getKycUsers = async ({ status, limit }: { status?: string; limit?: number }) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', String(limit));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/kyc/users?${params.toString()}`, headers: adminHeaders() });
  return res.data;
};

export const approveKycUser = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/kyc/${id}/approve`, headers: adminHeaders() })).data
);
export const rejectKycUser = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/kyc/${id}/reject`, headers: adminHeaders() })).data
);

// Admin Email utilities
export const adminResendVerification = async (email: string) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/email/resend-verification', data: { email }, headers: adminHeaders() })).data
);
export const adminSendInviteBulk = async (body: { recipients: string[]; campaign: string; grant_tokens?: number; grant_cash_usd?: number; max_redemptions?: number; expires_at?: string }) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/email/invites/bulk', data: body, headers: adminHeaders() })).data
);

// Preprovision users + send magic-link invites (preferred for Beta)
export const adminPreprovisionInvites = async (body: { recipients: string[]; campaign: string; grant_tokens?: number; grant_cash_usd?: number; max_redemptions?: number; expires_at?: string }) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/email/preprovision-invites', data: body, headers: adminHeaders() })).data
);

// Invites management
export const getInviteCodes = async () => (
  (await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/invites', headers: adminHeaders() })).data
);
export const getInviteStats = async () => (
  (await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/invites/stats', headers: adminHeaders() })).data
);
export const createInviteCode = async (body: { code?: string; campaign: string; max_redemptions: number; expires_at?: string; grant_tokens?: number; grant_cash_usd?: number; active?: boolean }) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/invites', data: body, headers: adminHeaders() })).data
);
export const createBulkInviteCodes = async (body: { count: number; campaign: string; max_redemptions: number; expires_at?: string; grant_tokens?: number; grant_cash_usd?: number; active?: boolean }) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/invites/bulk', data: body, headers: adminHeaders() })).data
);
export const updateInviteCode = async (id: string, patch: any) => (
  (await createBackendAxiosRequest<any>({ method: 'PUT', url: `/admin/invites/${id}`, data: patch, headers: adminHeaders() })).data
);
export const deleteInviteCode = async (id: string) => (
  (await createBackendAxiosRequest<any>({ method: 'DELETE', url: `/admin/invites/${id}`, headers: adminHeaders() })).data
);

// Users: search + ledger + adjustments
export const adminSearchUsers = async (q: string, limit = 50, skip = 0) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('limit', String(limit));
  params.set('skip', String(skip));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/users/search?${params.toString()}`, headers: adminHeaders() });
  return res.data;
};
export const adminGetUserLedger = async (userId: string, opts: { currency?: 'USDT'|'BET'; limit?: number; skip?: number } = {}) => {
  const params = new URLSearchParams();
  if (opts.currency) params.set('currency', opts.currency);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.skip) params.set('skip', String(opts.skip));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/users/${userId}/ledger?${params.toString()}`, headers: adminHeaders() });
  return res.data;
};
export const adminAdjustBalance = async (userId: string, body: { currency: 'USDT'|'BET'; delta: number; reason?: string }) => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/users/${userId}/adjust-balance`, data: body, headers: adminHeaders() })).data
);
export const adminUpdateUserRole = async (userId: string, role: 'admin'|'user'|'streamer') => (
  (await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/users/${userId}/role`, data: { role }, headers: adminHeaders() })).data
);

// Users: delete
export const adminDeleteUser = async (userId: string, opts: { cascade?: boolean } = {}) => {
  const params = new URLSearchParams();
  if (opts.cascade !== undefined) params.set('cascade', opts.cascade ? '1' : '0');
  const url = params.toString() ? `/admin/users/${userId}?${params.toString()}` : `/admin/users/${userId}`;
  return (await createBackendAxiosRequest<any>({ method: 'DELETE', url, headers: adminHeaders() })).data;
};

// Audit
export const getAdminAudit = async (opts: { actor?: string; action?: string; since?: string; q?: string; limit?: number; skip?: number }) => {
  const params = new URLSearchParams();
  if (opts.actor) params.set('actor', opts.actor);
  if (opts.action) params.set('action', opts.action);
  if (opts.since) params.set('since', opts.since);
  if (opts.q) params.set('q', opts.q);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.skip) params.set('skip', String(opts.skip));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/audit?${params.toString()}`, headers: adminHeaders() });
  return res.data;
};
