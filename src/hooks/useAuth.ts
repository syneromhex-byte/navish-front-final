import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@services/authApi';
import { useUserStore } from '@store/userStore';
import { useClientStore } from '@store/clientStore';
import { ROUTES } from '@constants/routes';
import { DEMO_ADMIN, DEMO_ADMIN_PASSWORD } from '@constants/demoAccounts';
import type { LoginPayload, RegisterPayload, User } from '@app-types/user.types';

function homeForRole(role: User['role']): string {
  return role === 'client' ? ROUTES.myModels : ROUTES.dashboard;
}

function toDisplayName(email: string): string {
  const local = email.split('@')[0] || 'Client';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_ADMIN.email.toLowerCase();
}

// No backend exists yet, so login/register hit an API that isn't there. Both
// fall back to a client-side session so a visitor can actually sign up and
// try the product end to end — the account only lives for this browser tab
// (never persisted). The admin email is reserved: matching it requires the
// placeholder demo password (see demoAccounts.ts) instead of silently
// becoming a client account, and self-registration on that email is blocked.
export function useAuth() {
  const setSession = useUserStore((state) => state.setSession);
  const addClientFromRegistration = useClientStore((state) => state.addClientFromRegistration);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await authApi.login(payload);
      setSession(session.user, session.accessToken);
      navigate(homeForRole(session.user.role));
      return;
    } catch {
      // no backend — fall through to local handling below
    }

    if (isAdminEmail(payload.email)) {
      if (payload.password === DEMO_ADMIN_PASSWORD) {
        setSession(DEMO_ADMIN, 'demo-access-token-admin');
        navigate(ROUTES.dashboard);
      } else {
        setError('Incorrect password.');
      }
      setIsSubmitting(false);
      return;
    }

    const user: User = {
      id: `client-${Date.now().toString(36)}`,
      name: toDisplayName(payload.email),
      email: payload.email,
      role: 'client',
    };
    setSession(user, `local-session-${user.id}`);
    addClientFromRegistration({ name: user.name, email: user.email });
    navigate(homeForRole(user.role));
    setIsSubmitting(false);
  };

  const register = async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await authApi.register(payload);
      setSession(session.user, session.accessToken);
      navigate(homeForRole(session.user.role));
      return;
    } catch {
      // no backend — fall through to local handling below
    }

    if (isAdminEmail(payload.email)) {
      setError('That email is reserved. Sign in instead.');
      setIsSubmitting(false);
      return;
    }

    const user: User = {
      id: `client-${Date.now().toString(36)}`,
      name: payload.name,
      email: payload.email,
      role: 'client',
    };
    setSession(user, `local-session-${user.id}`);
    addClientFromRegistration({ name: user.name, email: user.email });
    navigate(homeForRole(user.role));
    setIsSubmitting(false);
  };

  return { login, register, isSubmitting, error };
}
