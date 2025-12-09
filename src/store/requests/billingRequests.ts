import { createBackendAxiosRequest } from '.';
import { RequestReturnType } from 'types/state';

export const createDepositIntent = async (amount: number, currency: 'USDT' | 'USDC' = 'USDT') => (
  createBackendAxiosRequest<{ hosted_url: string; deposit_id: string }>({
    method: 'POST',
    url: '/billing/deposit/intent',
    data: { amount, currency },
  }) as unknown as RequestReturnType<{ hosted_url: string; deposit_id: string }>
);

export const listDeposits = async () => (
  createBackendAxiosRequest<{ deposits: any[] }>({
    method: 'GET',
    url: '/billing/deposits',
  }) as unknown as RequestReturnType<{ deposits: any[] }>
);

