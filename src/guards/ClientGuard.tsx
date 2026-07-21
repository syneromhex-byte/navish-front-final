import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';

export function ClientGuard() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Only allow client or viewer role
  const norm = user.role?.toLowerCase();
  if (norm !== 'client' && norm !== 'viewer') {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
