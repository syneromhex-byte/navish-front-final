export type UserRole = 'admin' | 'architect' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

/**
 * Response body for login/register/refresh. The refresh token itself never
 * appears here — the backend sets it as an httpOnly cookie, so it's never
 * readable by client JS.
 */
export interface AuthSession {
  user: User;
  accessToken: string;
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
