import { getBearerTokenHeader, getAuthEmail } from 'store/actionCreators';
import { createBackendAxiosRequest } from 'store/requests';

import {
  JwtSignInResponseData,
  AuthUserResponseData,
  BalanceHistoryResponseData,
  VerifyEmailResponseData,
  EmailVerificationStatusResponseData
} from 'types/resources/auth';
import { RequestReturnType } from 'types/state';
import { validateSchema } from 'validation';
import {
  AuthUserResponseSchema,
  JwtSignInResponseSchema,
  BalanceHistoryResponseSchema,
  VerifyEmailResponseSchema,
  EmailVerificationStatusResponseSchema
} from 'validation/auth';

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

export const verifyEmail = async (token: string): Promise<RequestReturnType<VerifyEmailResponseData>> => {
  const result = await createBackendAxiosRequest<VerifyEmailResponseData>({
    method: 'GET',
    url: `/auth/verify-email/${token}`,
  });

  // Validation here
  return validateSchema(VerifyEmailResponseSchema, result, (d) => d.data);
};

export const resendVerificationEmail = async (email?: string): Promise<RequestReturnType<{sent: boolean}>> => {
  // Belt-and-suspenders: fallback to last-known email if param not provided
  const fallbackEmail = email || getAuthEmail() || undefined;
  const result = await createBackendAxiosRequest<{sent: boolean}>({
    method: 'POST',
    url: '/auth/resend-verification',
    data: fallbackEmail ? { email: fallbackEmail } : {},
    // Force attach Authorization header via interceptor; include here as well
    headers: getBearerTokenHeader(),
  });

  return result;
};

export const checkEmailVerificationStatus = async (): Promise<RequestReturnType<EmailVerificationStatusResponseData>> => {
  const result = await createBackendAxiosRequest<EmailVerificationStatusResponseData>({
    method: 'GET',
    url: '/auth/verification-status',
    headers: getBearerTokenHeader(),
  });

  // Validation here
  return validateSchema(EmailVerificationStatusResponseSchema, result, (d) => d.data);
};
