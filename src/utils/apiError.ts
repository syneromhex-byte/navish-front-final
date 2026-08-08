import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@app-types/api.types';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
