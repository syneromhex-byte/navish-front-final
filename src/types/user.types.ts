export type UserRole = 'admin' | 'architect' | 'client' | 'viewer';

export interface User {
  id: string;
  /** Display name (may be composed from firstName + lastName on the backend) */
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  emailVerified?: boolean;
}

/**
 * Response body for login/refresh.
 * register does NOT return an AuthSession — it returns a User.
 * The refresh token is set in an httpOnly cookie by the backend.
 * The body refreshToken is only present when the backend explicitly includes it.
 */
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: string;
}

// ─── Request payload types ────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** Matches the backend registerSchema exactly. */
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'ARCHITECT' | 'CLIENT' | 'VIEWER';
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordOtpPayload {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SendOtpPayload {
  email: string;
  name?: string;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export interface ResendOtpPayload {
  email: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}
