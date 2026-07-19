export type UserRole = 'admin' | 'architect' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

/**
 * Response body for login/register/refresh. When the backend uses httpOnly
 * cookies for the refresh token, `refreshToken` will be absent. When the
 * backend returns it in the body (e.g. for mobile clients), it will be present.
 */
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
