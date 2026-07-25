/**
 * Standard backend envelope returned by every API response.
 * The backend always wraps payloads as { success, message, data }.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: unknown[];
}
