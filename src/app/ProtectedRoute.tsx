import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import { Loader } from '@components/common';
import type { UserRole } from '@app-types/user.types';

export interface ProtectedRouteProps {
  /** When set, only these roles may pass — others are redirected to their own home instead of being logged out. */
  allowedRoles?: UserRole[];
}

function homeForRole(role?: string): string {
  const norm = role?.toLowerCase();
  return norm === 'client' || norm === 'viewer' ? ROUTES.myModels : ROUTES.dashboard;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isInitializing = useUserStore((state) => state.isInitializing);
  const user = useUserStore((state) => state.user);
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <Loader size="lg" label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (allowedRoles) {
    const userRoleNorm = user.role?.toLowerCase();
    const allowedNorms = allowedRoles.map((r) => r.toLowerCase());
    if (!allowedNorms.includes(userRoleNorm)) {
      return <Navigate to={homeForRole(user.role)} replace />;
    }
  }

  return <Outlet />;
}
