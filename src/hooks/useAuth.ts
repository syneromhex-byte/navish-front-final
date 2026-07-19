import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@services/authApi';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import type { LoginPayload, RegisterPayload, User } from '@app-types/user.types';
import { getApiErrorMessage } from '@utils/apiError';

function homeForRole(role: User['role']): string {
  const normalizedRole = role?.toLowerCase();
  return normalizedRole === 'client' ? ROUTES.myModels : ROUTES.dashboard;
}

export function useAuth() {
  const setSession = useUserStore((state) => state.setSession);
  const clearSession = useUserStore((state) => state.clearSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await authApi.login(payload);
      setSession(session.user, session.accessToken, session.refreshToken);
      navigate(homeForRole(session.user.role));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await authApi.register(payload);
      setSession(session.user, session.accessToken, session.refreshToken);
      navigate(homeForRole(session.user.role));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearSession();
      navigate(ROUTES.home);
    }
  };

  return { login, register, logout, isSubmitting, error };
}
