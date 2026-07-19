import { apiClient } from '../apiClient';
import type { AuthSession, LoginPayload, RegisterPayload } from '@app-types/user.types';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthSession>('/auth/login', payload).then((res) => res.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthSession>('/auth/register', payload).then((res) => res.data),

  /** Exchanges the httpOnly refresh cookie for a new access token. */
  refresh: () => apiClient.post<AuthSession>('/auth/refresh').then((res) => res.data),

  logout: () => apiClient.post<void>('/auth/logout').then((res) => res.data),

  me: () => apiClient.get<AuthSession['user']>('/auth/me').then((res) => res.data),
};
