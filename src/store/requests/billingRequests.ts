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
