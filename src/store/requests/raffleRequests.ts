import { AxiosPromise } from 'axios';
import { getBearerTokenHeader } from 'store/actionCreators';
import { createBackendAxiosRequest } from 'store/requests';
import {
  CurrentRaffleResponse,
  RaffleHistoryResponse,
  RaffleOptInResponse
} from 'types/resources/raffle';
import { RequestReturnType } from 'types/state';

export const fetchCurrentRaffles = (): Promise<RequestReturnType<CurrentRaffleResponse>> => {
  const authHeader = getBearerTokenHeader();
  console.log('fetchCurrentRaffles - auth header:', authHeader);
  return createBackendAxiosRequest<CurrentRaffleResponse>({
    method: 'GET',
    url: 'raffle/current',
    headers: authHeader,
  });
};

export const fetchRaffleHistory = (page = 1, limit = 10): Promise<RequestReturnType<RaffleHistoryResponse>> =>
  createBackendAxiosRequest<RaffleHistoryResponse>({
    method: 'GET',
    url: 'raffle/history',
    params: { page, limit },
    headers: getBearerTokenHeader(),
  });

export const optInToRaffle = (drawId: string): Promise<RequestReturnType<RaffleOptInResponse>> =>
  createBackendAxiosRequest<RaffleOptInResponse>({
    method: 'POST',
    url: 'raffle/opt-in',
    data: { drawId },
    headers: getBearerTokenHeader(),
  });