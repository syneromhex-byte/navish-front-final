import { NavLink, Outlet } from 'react-router-dom';
import { useUserStore } from '@store/userStore';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';
import { cn } from '@utils/cn';

const SIDEBAR_LINKS = [
  { label: 'Overview', to: ROUTES.dashboardOverview },
  { label: 'Projects', to: ROUTES.dashboardProjects },
  { label: 'Clients', to: ROUTES.dashboardClients },
  { label: 'Settings', to: ROUTES.dashboardSettings },
];

export function DashboardLayout() {
  const user = useUserStore((state) => state.user);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-surface-0">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-1 px-4 py-6">
        <NavLink
          to={ROUTES.home}
          className="px-2 font-display text-lg font-semibold text-text-primary"
        >
          {BRAND_NAME}
        </NavLink>

        <nav className="mt-8 flex flex-col gap-1">
          {SIDEBAR_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ROUTES.dashboardOverview}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {user?.name.slice(0, 1).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium text-text-primary">
                {user?.name ?? 'Guest'}
              </p>
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {user?.role ?? 'User'}
              </span>
            </div>
            <p className="truncate text-xs text-text-tertiary">{user?.email ?? ''}</p>
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
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
