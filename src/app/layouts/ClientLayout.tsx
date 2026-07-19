import { NavLink, Outlet } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';

export function ClientLayout() {
  const user = useUserStore((state) => state.user);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <NavLink
          to={ROUTES.myModels}
          className="font-display text-lg font-semibold text-text-primary"
        >
          {BRAND_NAME}
        </NavLink>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name ?? 'Guest'}</p>
            <p className="text-xs text-text-tertiary">{user?.email ?? ''}</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {user?.name.slice(0, 1).toUpperCase() ?? '?'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-white/[0.08] hover:text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2H6M10.5 11l3-3-3-3M13.5 8h-8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
