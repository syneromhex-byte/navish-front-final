import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@store/userStore';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useUserStore.getState().accessToken;
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

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

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      useUserStore.getState().clearSession();
      return Promise.reject(error);
    }

    originalRequest._retried = true;

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
      const { data } = await apiClient.post<any>('/auth/refresh', { refreshToken });
      const newAccessToken = data.accessToken ?? data.token;
      
      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      if (data.user) {
        useUserStore.getState().setSession(data.user, newAccessToken, data.refreshToken ?? refreshToken);
      } else {
        useUserStore.getState().setAccessToken(newAccessToken);
        if (data.refreshToken) {
          useUserStore.getState().setRefreshToken(data.refreshToken);
        }
      }

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
