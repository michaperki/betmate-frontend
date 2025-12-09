import { getBearerTokenHeader } from 'store/actionCreators';
import { createBackendAxiosRequest } from 'store/requests';

import { FetchWagerData, FetchWagersData, UserBettingStats, WagerStatus } from 'types/resources/wager';
import { RequestReturnType } from 'types/state';
import { validateSchema } from 'validation';
import { WagerArraySchema, WagerSchema } from 'validation/wager';

export const createWager = async (
  gameId: string,
  wager: string,
  amount: number,
  wdl: boolean,
  odds: number,
  moveNumber: number,
  mode?: 'arcade' | 'real',
  currency?: 'BET' | 'USDT',
): Promise<RequestReturnType<FetchWagerData>> => {
  const result = await createBackendAxiosRequest<FetchWagerData>({
    method: 'POST',
    url: `/wager/${gameId}`,
    data: {
      wdl,
      amount,
      data: wager,
      odds,
      move_number: moveNumber,
      mode,
      currency,
    },
    headers: getBearerTokenHeader(),
    timeout: 5000, // default is 1000ms, but this endpoint has an intentional 1000ms delay + is making an API request
  });

  return validateSchema(WagerSchema, result, (d) => d.data);
};

export const fetchWagerById = async (id: string): Promise<RequestReturnType<FetchWagerData>> => {
  const result = await createBackendAxiosRequest<FetchWagerData>({
    method: 'GET',
    url: `/wager/${id}`,
    headers: getBearerTokenHeader(),
  });

  return validateSchema(WagerSchema, result, (d) => d.data);
};

export const fetchWagers = async (): Promise<RequestReturnType<FetchWagersData>> => {
  const result = await createBackendAxiosRequest<FetchWagersData>({
    method: 'GET',
    url: '/wager',
    headers: getBearerTokenHeader(),
  });

  return validateSchema(WagerArraySchema, result, (d) => d.data);
};

export const fetchUserBettingStats = async (): Promise<RequestReturnType<UserBettingStats>> => {
  return await createBackendAxiosRequest<UserBettingStats>({
    method: 'GET',
    url: '/wager/stats',
    headers: getBearerTokenHeader(),
  });
};

export const fetchActiveWagers = async (): Promise<RequestReturnType<FetchWagersData>> => {
  const result = await createBackendAxiosRequest<FetchWagersData>({
    method: 'GET',
    url: '/wager/active',
    headers: getBearerTokenHeader(),
  });

  return validateSchema(WagerArraySchema, result, (d) => d.data);
};

export const fetchWagerHistory = async (
  status?: WagerStatus,
  limit?: number,
  skip?: number
): Promise<RequestReturnType<FetchWagersData>> => {
  // Build query params
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (limit) params.append('limit', limit.toString());
  if (skip) params.append('skip', skip.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';

  const result = await createBackendAxiosRequest<FetchWagersData>({
    method: 'GET',
    url: `/wager/history${queryString}`,
    headers: getBearerTokenHeader(),
  });

  return validateSchema(WagerArraySchema, result, (d) => d.data);
};
