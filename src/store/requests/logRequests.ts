import { createBackendAxiosRequest } from 'store/requests';
import { getBearerTokenHeader } from 'store/actionCreators';

export const reportIssue = async (
  description: string,
  category?: string,
  extra?: Record<string, any>,
) => {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return createBackendAxiosRequest<{ ok: boolean }>({
    method: 'POST',
    url: '/api/log/issue',
    data: {
      description, category, url, extra,
    },
    headers: getBearerTokenHeader(),
  });
};
