import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@services/authApi';
import { useClientStore } from '@store/clientStore';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordOtpPayload,
  ChangePasswordPayload,
  User,
} from '@app-types/user.types';
import { getApiErrorMessage } from '@utils/apiError';

function homeForRole(role: User['role']): string {
  const normalizedRole = role?.toLowerCase();
  return normalizedRole === 'client' || normalizedRole === 'viewer'
    ? ROUTES.myModels
    : ROUTES.dashboard;
}

export function useAuth() {
  const setSession = useUserStore((state) => state.setSession);
  const clearSession = useUserStore((state) => state.clearSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await authApi.login(payload);
      setSession(session.user, session.accessToken, undefined);

      if (session.user) {
        const displayName =
          session.user.name ||
          `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() ||
          'Client';
        useClientStore.getState().addClientFromRegistration({
          name: displayName,
          email: session.user.email,
        });
      }

      navigate(homeForRole(session.user.role));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Register ─────────────────────────────────────────────────────────────
  // The backend creates the user without returning a session.
  // After registration, the user is redirected to login.

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.register(payload);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create account.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      navigate(ROUTES.home);
    }
  };

  // ─── Forgot password ──────────────────────────────────────────────────────

  const forgotPassword = async (payload: ForgotPasswordPayload): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword(payload);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send reset email.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Reset password via OTP ───────────────────────────────────────────────

  const resetPasswordOtp = async (payload: ResetPasswordOtpPayload): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.resetPasswordOtp(payload);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset password.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Change password ──────────────────────────────────────────────────────

  const changePassword = async (payload: ChangePasswordPayload): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.changePassword(payload);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change password.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    login,
    register,
    logout,
    forgotPassword,
    resetPasswordOtp,
    changePassword,
    isSubmitting,
    error,
    setError,
  };
}
