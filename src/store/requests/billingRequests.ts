import { createBackendAxiosRequest } from '.';
import { FAUCET_ADMIN_KEY } from 'utils/config';
import { getBearerTokenHeader } from 'store/actionCreators';
import { RequestReturnType } from 'types/state';

export const createDepositIntent = async (amount: number, payCurrency: string) => (
  createBackendAxiosRequest<{ hosted_url: string; deposit_id: string }>({
    method: 'POST',
    url: '/billing/deposit/intent',
    data: { amount, payCurrency },
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<{ hosted_url: string; deposit_id: string }>
);

export const listDeposits = async () => (
  createBackendAxiosRequest<{ deposits: any[] }>({
    method: 'GET',
    url: '/billing/deposits',
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<{ deposits: any[] }>
);

export const getDepositQuote = async (amount: number, payCurrency: string) => (
  createBackendAxiosRequest<{
    desired_usd: number;
    charge_usd: number;
    fee_usd: number;
    fee_rate: number;
    fixed_fee_usd: number;
    pay_currency: string;
    estimated_pay_amount: number;
    bounds: { min_usd: number; max_usd: number };
  }>({
    method: 'GET',
    url: '/billing/quote',
    params: { amount, payCurrency },
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<any>
);

export const faucetCredit = async (amount: number, currency?: 'BET' | 'USDT' | 'both') => (
  createBackendAxiosRequest<{ ok: boolean; credited: number; tokens?: number }>({
    method: 'POST',
    url: '/billing/faucet',
    data: { amount, ...(currency ? { currency } : {}) },
    headers: {
      ...getBearerTokenHeader(),
      ...(FAUCET_ADMIN_KEY ? { 'X-Admin-Key': FAUCET_ADMIN_KEY } : {}),
    },
  }) as unknown as RequestReturnType<{ ok: boolean; credited: number; tokens?: number }>
);

export const listWithdrawals = async () => (
  createBackendAxiosRequest<{ withdrawals: any[] }>({
    method: 'GET',
    url: '/billing/withdrawals',
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<{ withdrawals: any[] }>
);

export const requestWithdrawal = async (amount: number, currency: string, address: string, method?: 'manual'|'venmo'|'crypto', handle?: string) => (
  createBackendAxiosRequest<{ ok: boolean; withdrawal_id: string }>({
    method: 'POST',
    url: '/billing/withdrawals/request',
    data: { amount, currency, address, ...(method ? { method } : {}), ...(handle ? { handle } : {}) },
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<{ ok: boolean; withdrawal_id: string }>
);

export const cancelWithdrawal = async (id: string) => (
  createBackendAxiosRequest<{ ok: boolean; status: string }>({
    method: 'POST',
    url: `/billing/withdrawals/${encodeURIComponent(id)}/cancel`,
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<{ ok: boolean; status: string }>
);

export const startKycMock = async () => (
  createBackendAxiosRequest<{ ok: boolean; kyc_status: string }>({
    method: 'POST',
    url: '/auth/kyc/start',
    headers: getBearerTokenHeader(),
  }) as unknown as RequestReturnType<{ ok: boolean; kyc_status: string }>
);
