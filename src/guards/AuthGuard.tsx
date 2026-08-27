import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import { Loader } from '@components/common';

export function AuthGuard() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isInitializing = useUserStore((state) => state.isInitializing);
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <Loader size="lg" label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
