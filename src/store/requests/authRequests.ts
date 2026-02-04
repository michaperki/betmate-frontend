import { getBearerTokenHeader } from 'store/actionCreators';
import { createBackendAxiosRequest } from 'store/requests';

import { JwtSignInResponseData, AuthUserResponseData, BalanceHistoryResponseData } from 'types/resources/auth';
import { RequestReturnType } from 'types/state';
import { validateSchema } from 'validation';
import { AuthUserResponseSchema, JwtSignInResponseSchema, BalanceHistoryResponseSchema } from 'validation/auth';
import axios from 'axios';

export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  invite_code: string,
  device_id?: string,
): Promise<RequestReturnType<AuthUserResponseData>> => {
  const result = await createBackendAxiosRequest<AuthUserResponseData>({
    method: 'POST',
    url: '/auth/signup',
    data: {
      email,
      password,
      firstName,
      lastName,
      invite_code,
      ...(device_id ? { device_id } : {}),
    },
  });

  // Validation here
  return validateSchema(AuthUserResponseSchema, result, (d) => d.data);
};

export const signInUser = async (email: string, password: string): Promise<RequestReturnType<AuthUserResponseData>> => {
  const result = await createBackendAxiosRequest<AuthUserResponseData>({
    method: 'POST',
    url: '/auth/signin',
    data: {
      email,
      password,
    },
  });

  // Validation here
  return validateSchema(AuthUserResponseSchema, result, (d) => d.data);
};

export const jwtSignIn = async (): Promise<RequestReturnType<JwtSignInResponseData>> => {
  const result = await createBackendAxiosRequest<JwtSignInResponseData>({
    method: 'GET',
    url: '/auth/jwt-signin',
    headers: getBearerTokenHeader(),
  });

  // Validation here
  return validateSchema(JwtSignInResponseSchema, result, (d) => d.data);
};

export const getBalanceHistory = async (limit = 30, currency?: 'BET' | 'USDT'): Promise<RequestReturnType<BalanceHistoryResponseData>> => {
  const result = await createBackendAxiosRequest<BalanceHistoryResponseData>({
    method: 'GET',
    url: `/auth/balance-history?limit=${limit}${currency ? `&currency=${currency}` : ''}`,
    headers: getBearerTokenHeader(),
  });

  // Validation here
  return validateSchema(BalanceHistoryResponseSchema, result, (d) => d.data);
};

// Onboarding status/version
export const getOnboardingStatus = async (): Promise<{ versionSeen: number; currentVersion: number }> => {
  const res = await createBackendAxiosRequest<any>({
    method: 'GET',
    url: '/auth/onboarding',
    headers: getBearerTokenHeader(),
  });
  return res.data as any;
};
export const setOnboardingVersion = async (version: number): Promise<{ versionSeen: number; currentVersion: number }> => {
  const res = await createBackendAxiosRequest<any>({
    method: 'PUT',
    url: '/auth/onboarding',
    data: { version },
    headers: getBearerTokenHeader(),
  });
  return res.data as any;
};

// Beta magic-link sign-in: exchanges single-use token for JWT + user
export const magicSignIn = async (token: string): Promise<{ token: string; user: any; refreshToken?: string; csrfToken?: string }> => {
  const result = await createBackendAxiosRequest<any>({
    method: 'GET',
    url: `/auth/magic/${encodeURIComponent(token)}`,
  });
  const data = result.data || {};
  if (!data.token || !data.user) throw new Error('Magic login failed');
  return data;
};

// Update current user (e.g., first_name)
export const updateMe = async (patch: { first_name?: string; onboarding_version_seen?: number }) => {
  const res = await createBackendAxiosRequest<any>({
    method: 'PUT',
    url: '/auth/me',
    data: patch,
    headers: getBearerTokenHeader(),
  });
  return res.data;
};
