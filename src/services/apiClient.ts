import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@store/userStore';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
  timeout: 15_000,       // abort requests that hang for more than 15 s
});

// ─── Request interceptor — attach access token ───────────────────────────────

apiClient.interceptors.request.use((config) => {
  const isRefreshEndpoint = config.url?.includes('/auth/refresh');
  const accessToken = useUserStore.getState().accessToken;
  if (accessToken && !isRefreshEndpoint) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// ─── Response interceptor — transparent token refresh on 401 ─────────────────

let isRefreshing = false;
let pendingRequests: ((token: string | null) => void)[] = [];

function resolvePendingRequests(token: string | null) {
  pendingRequests.forEach((resolve) => resolve(token));
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // Only handle 401s on non-retried requests that have a config to replay.
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried) {
      return Promise.reject(error);
    }

    // If the refresh itself returned 401 the session is dead — clear it.
    if (originalRequest.url?.includes('/auth/refresh')) {
      useUserStore.getState().clearSession();
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    // Queue subsequent 401 requests until the refresh resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.set('Authorization', `Bearer ${token}`);
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = useUserStore.getState().refreshToken;

      // Backend envelope: { success, message, data: { accessToken } }
      const { data: envelope } = await apiClient.post<{
        success: boolean;
        data: { accessToken: string };
      }>('/auth/refresh', { refreshToken });

      const newAccessToken = envelope.data?.accessToken;

      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      useUserStore.getState().setAccessToken(newAccessToken);

      resolvePendingRequests(newAccessToken);
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolvePendingRequests(null);
      useUserStore.getState().clearSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
