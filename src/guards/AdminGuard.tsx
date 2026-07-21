import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';

export function AdminGuard() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Only allow admin and architect roles
  const norm = user.role?.toLowerCase();
  if (norm !== 'admin' && norm !== 'architect') {
    return <Navigate to={ROUTES.myModels} replace />;
  }

  return <Outlet />;
}
