import { createBackendAxiosRequest } from 'store/requests';
import { RequestReturnType } from 'types/state';
import { FeaturedMatchDTO, MatchDetailsDTO } from 'types/matches';

export const getFeaturedMatch = async (): Promise<RequestReturnType<FeaturedMatchDTO>> => {
  return createBackendAxiosRequest<FeaturedMatchDTO>({
    method: 'GET',
    url: '/matches/featured',
  });
};

export const getMatchDetails = async (id: string): Promise<RequestReturnType<MatchDetailsDTO>> => {
  return createBackendAxiosRequest<MatchDetailsDTO>({
    method: 'GET',
    url: `/matches/${id}/details`,
  });
};
