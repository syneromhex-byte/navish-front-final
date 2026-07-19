import { apiClient } from '../apiClient';
import type { AuthSession, LoginPayload, RegisterPayload } from '@app-types/user.types';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthSession>('/auth/login', payload).then((res) => res.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthSession>('/auth/register', payload).then((res) => res.data),

  /** Exchanges the refresh token (cookie or body) for a new access token. */
  refresh: (refreshToken?: string | null) =>
    apiClient.post<AuthSession>('/auth/refresh', { refreshToken }).then((res) => res.data),

  logout: () => apiClient.post<void>('/auth/logout').then((res) => res.data),

  me: () => apiClient.get<AuthSession['user']>('/auth/me').then((res) => res.data),
};
