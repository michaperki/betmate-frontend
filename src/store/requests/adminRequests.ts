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

export const getAdminDeposits = async ({ status, since, limit, skip }: { status?: string; since?: string; limit?: number; skip?: number; }) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (since) params.set('since', since);
  if (limit) params.set('limit', String(limit));
  if (skip) params.set('skip', String(skip));
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

export const getOpsLatencySample = async () => {
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/ops/latency', headers: adminHeaders() });
  return res.data as { ts: number; db: { ok: boolean; ms: number | null }; microservice: { ok: boolean; ms: number | null; status: number }; email: { provider: string } };
};

export const clearStaleWagers = async (olderThanMinutes: number) => {
  const res = await createBackendAxiosRequest<any>({ method: 'POST', url: '/admin/dev/clear-stale-wagers', data: { olderThanMinutes }, headers: adminHeaders() });
  return res.data;
};

// Withdrawals (admin)
export const getAdminWithdrawals = async ({ status, since, limit, skip }: { status?: string; since?: string; limit?: number; skip?: number; }) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (since) params.set('since', since);
  if (limit) params.set('limit', String(limit));
  if (skip) params.set('skip', String(skip));
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

// Invite code management
export const getInviteCodes = async ({ campaign, active, limit = 50, skip = 0 }: {
  campaign?: string;
  active?: boolean;
  limit?: number;
  skip?: number;
}) => {
  const params = new URLSearchParams();
  if (campaign) params.set('campaign', campaign);
  if (active !== undefined) params.set('active', String(active));
  if (limit) params.set('limit', String(limit));
  if (skip) params.set('skip', String(skip));

  const res = await createBackendAxiosRequest<any>({
    method: 'GET',
    url: `/admin/invites?${params.toString()}`,
    headers: adminHeaders()
  });
  return res.data;
};

export const getInviteStats = async () => {
  const res = await createBackendAxiosRequest<any>({
    method: 'GET',
    url: '/admin/invites/stats',
    headers: adminHeaders()
  });
  return res.data;
};

export const createInviteCode = async (inviteData: {
  code?: string;
  campaign: string;
  max_redemptions: number;
  expires_at?: string;
  grant_tokens?: number;
  grant_cash_usd?: number;
  active?: boolean;
}) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'POST',
    url: '/admin/invites',
    data: inviteData,
    headers: adminHeaders()
  });
  return res.data;
};

export const createBulkInviteCodes = async (bulkData: {
  count: number;
  campaign: string;
  max_redemptions: number;
  expires_at?: string;
  grant_tokens?: number;
  grant_cash_usd?: number;
  active?: boolean;
}) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'POST',
    url: '/admin/invites/bulk',
    data: bulkData,
    headers: adminHeaders()
  });
  return res.data;
};

export const updateInviteCode = async (id: string, updateData: {
  campaign?: string;
  max_redemptions?: number;
  expires_at?: string | null;
  grant_tokens?: number;
  grant_cash_usd?: number;
  active?: boolean;
}) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'PUT',
    url: `/admin/invites/${id}`,
    data: updateData,
    headers: adminHeaders()
  });
  return res.data;
};

export const deleteInviteCode = async (id: string) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'DELETE',
    url: `/admin/invites/${id}`,
    headers: adminHeaders()
  });
  return res.data;
};

export const getAdminPaymentVolumeDaily = async (days = 7) => {
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/wallet/volume/daily?days=${days}`, headers: adminHeaders() });
  return res.data as { deposits: Array<{ date: string; status?: string; count: number }>; withdrawals: Array<{ date: string; status?: string; count: number }>; since: string; days: number };
};

// Email (admin)
export const sendAdminTestEmail = async ({ to, subject, message }: { to: string; subject?: string; message?: string; }) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'POST',
    url: '/admin/email/test',
    data: { to, subject, message },
    headers: adminHeaders(),
  });
  return res.data as { ok: boolean; messageId?: string; previewUrl?: string; error?: string };
};

export const adminResendVerification = async (email: string) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'POST',
    url: '/admin/email/resend-verification',
    data: { email },
    headers: adminHeaders(),
  });
  return res.data as { ok: boolean; sent?: boolean; error?: string };
};

export const adminSendInviteBulk = async (payload: {
  recipients: string[] | string;
  campaign?: string;
  expires_at?: string;
  grant_tokens?: number;
  grant_cash_usd?: number;
  max_redemptions?: number;
}) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'POST',
    url: '/admin/email/invites/bulk',
    data: payload,
    headers: adminHeaders(),
  });
  return res.data as { ok: boolean; count: number; results: Array<{ to: string; code: string; error?: string }>; };
};

// Reconciliation (existing billing endpoints; admin-key gated)
export const reconcileNowpaymentsDeposits = async (limit = 20, opts?: { dryRun?: boolean }) => {
  // Prefer admin-guarded endpoints; fall back to legacy /billing for dev
  try {
    const res = await createBackendAxiosRequest<any>({
      method: 'POST',
      url: `/admin/payments/reconcile/deposits?limit=${limit}${opts?.dryRun ? '&dryRun=true' : ''}`,
      headers: adminHeaders(),
    });
    return res.data;
  } catch (_e) {
    const res = await createBackendAxiosRequest<any>({
      method: 'POST',
      url: `/billing/reconcile/nowpayments?limit=${limit}`,
      headers: adminHeaders(),
    });
    return res.data;
  }
};

export const reconcileNowpaymentsPayouts = async (limit = 20, opts?: { dryRun?: boolean }) => {
  try {
    const res = await createBackendAxiosRequest<any>({
      method: 'POST',
      url: `/admin/payments/reconcile/payouts?limit=${limit}${opts?.dryRun ? '&dryRun=true' : ''}`,
      headers: adminHeaders(),
    });
    return res.data;
  } catch (_e) {
    const res = await createBackendAxiosRequest<any>({
      method: 'POST',
      url: `/billing/reconcile/nowpayments-payouts?limit=${limit}`,
      headers: adminHeaders(),
    });
    return res.data;
  }
};

export const reissueNowpaymentsInvoice = async (id: string, force?: boolean) => {
  try {
    const res = await createBackendAxiosRequest<any>({
      method: 'POST',
      url: `/admin/payments/reissue/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
      headers: adminHeaders(),
    });
    return res.data;
  } catch (_e) {
    const res = await createBackendAxiosRequest<any>({
      method: 'POST',
      url: `/billing/reissue/nowpayments/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
      headers: adminHeaders(),
    });
    return res.data;
  }
};

// Users (admin)
export const adminSearchUsers = async (q: string, limit = 20, skip = 0) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (limit) params.set('limit', String(limit));
  if (skip) params.set('skip', String(skip));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/users/search?${params.toString()}`, headers: adminHeaders() });
  return res.data as { users: Array<{ _id: string; email: string; role: string; email_verified?: boolean; kyc_status?: string; cash_balance?: number; token_balance?: number }>; total: number };
};

export const adminGetUserLedger = async (userId: string, opts?: { currency?: 'USDT'|'BET'; limit?: number; skip?: number }) => {
  const params = new URLSearchParams();
  if (opts?.currency) params.set('currency', opts.currency);
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.skip) params.set('skip', String(opts.skip));
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: `/admin/users/${encodeURIComponent(userId)}/ledger?${params.toString()}`, headers: adminHeaders() });
  return res.data as { items: Array<{ amount: number; reason: string; reference_id?: string; reference_type?: string; currency: string; created_at: string }>; total?: number };
};

export const adminAdjustBalance = async (userId: string, payload: { currency: 'USDT'|'BET'; delta: number; reason?: string }) => {
  const res = await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/users/${encodeURIComponent(userId)}/adjust-balance`, data: payload, headers: adminHeaders() });
  return res.data as { ok: boolean };
};

export const adminUpdateUserRole = async (userId: string, role: 'user'|'admin') => {
  const res = await createBackendAxiosRequest<any>({ method: 'POST', url: `/admin/users/${encodeURIComponent(userId)}/role`, data: { role }, headers: adminHeaders() });
  return res.data as { ok: boolean; user: { _id: string; role: string } };
};

export const getOpsRuntime = async () => {
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url: '/admin/ops/runtime', headers: adminHeaders() });
  return res.data as { env: any; version: any; email: any; features: any };
};

// Audit (read-only stub)
export const getAdminAudit = async (opts?: { limit?: number; skip?: number; actor?: string; action?: string; since?: string; q?: string }) => {
  const params = new URLSearchParams();
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.skip) params.set('skip', String(opts.skip));
  if (opts?.actor) params.set('actor', opts.actor);
  if (opts?.action) params.set('action', opts.action);
  if (opts?.since) params.set('since', opts.since);
  if (opts?.q) params.set('q', opts.q);
  const url = `/admin/audit${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await createBackendAxiosRequest<any>({ method: 'GET', url, headers: adminHeaders() });
  return res.data as { entries: any[]; total: number };
};
