import { AxiosError } from 'axios';
import { Code } from 'types/state';

export const getErrorPayload = <T = any>(error: Error | AxiosError<T>): { message: string, code: Code } => {
  if ((error as AxiosError).isAxiosError) {
    const ax = error as AxiosError<any>;
    const data = ax.response?.data as any;
    return ({
      message: data?.errors?.join?.('. ') || data?.message || data?.error || ax.message,
      // Prefer backend code field if provided (e.g., CAP_PER_BET), else HTTP status or axios code
      code: data?.code || ax.response?.status || (ax as any).code || ax.name || null,
    });
  }

  return ({
    message: error.message,
    code: error.name || null,
  });
};
