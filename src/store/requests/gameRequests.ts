import { createBackendAxiosRequest } from 'store/requests';

import { FetchGameData, FetchGamesData } from 'types/resources/game';
import { RequestReturnType } from 'types/state';
import { validateSchema } from 'validation';
import { GameSchema, GameArraySchema } from 'validation/game';

export const fetchGameById = async (id: string): Promise<RequestReturnType<FetchGameData>> => {
  const result = await createBackendAxiosRequest<FetchGameData>({
    method: 'GET',
    url: `/chess/${id}`,
  });

  return validateSchema(GameSchema, result, (d) => d.data);
};

export const fetchGamesByStatus = async (game_status: string[]): Promise<RequestReturnType<FetchGamesData>> => {
  const result = await createBackendAxiosRequest<FetchGamesData>({
    method: 'GET',
    url: '/chess/',
    params: { game_status },
  });

  return validateSchema(GameArraySchema, result, (d) => d.data);
};

export const fetchGameStats = async (id: string): Promise<RequestReturnType<any>> => {
  const result = await createBackendAxiosRequest<any>({
    method: 'GET',
    url: `/chess/${id}/stats`,
  });

  // For now, return without validation as we're adding a new endpoint
  // TODO: Add proper validation schema for game stats
  return result;
};
