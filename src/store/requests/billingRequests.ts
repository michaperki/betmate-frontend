import { createBackendAxiosRequest } from '.';
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
