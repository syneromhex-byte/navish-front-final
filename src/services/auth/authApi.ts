import { apiClient } from '../apiClient';
import type { ApiEnvelope } from '@app-types/api.types';
import type {
  AuthSession,
  User,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordOtpPayload,
  ChangePasswordPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
} from '@app-types/user.types';

/**
 * Centralised auth API client.
 *
 * Every method unwraps the standard backend envelope:
 *   { success, message, data: <actual payload> }
 * so callers receive the inner `data` object directly.
 */
export const authApi = {
  // ─── Session ─────────────────────────────────────────────────────────────

  /**
   * Authenticate with email + password.
   * Backend sets the refresh token in an httpOnly cookie.
   * Returns { accessToken, user, expiresIn }.
   */
  login: (payload: LoginPayload): Promise<AuthSession> =>
    apiClient
      .post<ApiEnvelope<AuthSession>>('/auth/login', payload)
      .then((res) => res.data.data),

  /**
   * Get the authenticated user's profile.
   */
  me: (): Promise<User> =>
    apiClient
      .get<ApiEnvelope<User>>('/auth/me')
      .then((res) => res.data.data),

  /**
   * Silently refresh the access token using the httpOnly refresh-token cookie
   * (or an explicit refreshToken in the body as a fallback for native clients).
   * Returns only { accessToken } — user is NOT included.
   */
  refresh: (refreshToken?: string | null): Promise<{ accessToken: string }> =>
    apiClient
      .post<ApiEnvelope<{ accessToken: string }>>('/auth/refresh', { refreshToken })
      .then((res) => res.data.data),

  /**
   * Revoke the current session.
   * Backend clears the httpOnly cookie.
   */
  logout: (): Promise<void> =>
    apiClient.post<void>('/auth/logout').then(() => undefined),

  // ─── Registration (OTP-first flow) ───────────────────────────────────────

  /**
   * Step 1: Request an email-verification OTP before account creation.
   * Throws 409 if the email is already registered.
   */
  sendOtp: (payload: SendOtpPayload): Promise<void> =>
    apiClient
      .post<ApiEnvelope<null>>('/auth/send-otp', payload)
      .then(() => undefined),

  /**
   * Step 2: Verify the email OTP.
   * Throws 400 if the code is invalid or expired.
   */
  verifyOtp: (payload: VerifyOtpPayload): Promise<void> =>
    apiClient
      .post<ApiEnvelope<null>>('/auth/verify-otp', payload)
      .then(() => undefined),

  /**
   * Step 3: Create the user account.
   * The backend also sends a verification email and re-sends OTP.
   * Returns the created User — NOT an AuthSession.
   * After registration, the user must login separately.
   */
  register: (payload: RegisterPayload): Promise<User> =>
    apiClient
      .post<ApiEnvelope<User>>('/auth/register', payload)
      .then((res) => res.data.data),

  /**
   * Resend an OTP for email verification or password reset.
   * Requires the user account to already exist.
   */
  resendOtp: (payload: ResendOtpPayload): Promise<void> =>
    apiClient
      .post<ApiEnvelope<null>>('/auth/resend-otp', payload)
      .then(() => undefined),

  // ─── Password management ─────────────────────────────────────────────────

  /**
   * Trigger the forgot-password flow.
   * Backend sends a reset link + OTP to the email if it exists.
   * Always succeeds to prevent email enumeration.
   */
  forgotPassword: (payload: ForgotPasswordPayload): Promise<void> =>
    apiClient
      .post<ApiEnvelope<null>>('/auth/forgot-password', payload)
      .then(() => undefined),

  /**
   * Reset password using OTP (no link token required).
   * Flow: forgotPassword → enter OTP → resetPasswordOtp
   */
  resetPasswordOtp: (payload: ResetPasswordOtpPayload): Promise<void> =>
    apiClient
      .post<ApiEnvelope<null>>('/auth/reset-password-otp', payload)
      .then(() => undefined),

  /**
   * Change password for an authenticated user.
   * Requires a valid access token (Authorization header).
   */
  changePassword: (payload: ChangePasswordPayload): Promise<void> =>
    apiClient
      .post<ApiEnvelope<null>>('/auth/change-password', payload)
      .then(() => undefined),
};
