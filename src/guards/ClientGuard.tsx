import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';

export function ClientGuard() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Only allow client role
  if (user.role !== 'client') {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
