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
