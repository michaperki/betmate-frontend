import { createBackendAxiosRequest } from 'store/requests';
import { RequestReturnType } from 'types/state';

export interface RealWdlMarketResponse {
  gameId: string;
  type: 'wdl';
  status: 'open' | 'locked' | 'settled';
  prices: { white: number; draw: number; black: number };
  q: { white: number; draw: number; black: number };
  b: number;
  rake: number;
  myPosition?: { white: number; draw: number; black: number };
}

export const getRealWdlMarket = async (
  gameId: string,
): Promise<RequestReturnType<RealWdlMarketResponse>> => (
  createBackendAxiosRequest<RealWdlMarketResponse>({
    method: 'GET',
    url: `/real/markets/${gameId}`,
  })
);

