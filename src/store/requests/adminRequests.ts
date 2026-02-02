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
