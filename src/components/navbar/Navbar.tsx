import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { buttonClasses } from '@components/common';
import { NavishLogo } from '@components/common';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';
import { cn } from '@utils/cn';

function profileHref(role?: string): string {
  const norm = role?.toLowerCase();
  return norm === 'client' || norm === 'viewer' ? ROUTES.myModels : ROUTES.dashboard;
}

const NAV_LINKS = [
  { label: 'Home', to: ROUTES.home },
  { label: 'Portfolio', to: ROUTES.portfolio },
  { label: 'Projects', to: ROUTES.projects },
  { label: 'Services', to: ROUTES.services },
  { label: 'Contact', to: ROUTES.contact },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const [lastPathname, setLastPathname] = useState(location.pathname);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setIsMobileOpen(false);
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        isScrolled ? 'glass-panel bg-surface-0/70' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <NavLink
          to={ROUTES.home}
          className="flex items-center gap-3 font-display text-xl font-bold tracking-tight text-text-primary group"
        >
          <NavishLogo size={44} className="transition-transform group-hover:scale-105" />
          <span>{BRAND_NAME}</span>
        </NavLink>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ROUTES.home}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NavLink
            to={isAuthenticated ? profileHref(user?.role) : ROUTES.login}
            className={buttonClasses('primary', 'sm')}
          >
            {isAuthenticated ? (user?.firstName ?? 'Profile') : 'Sign In'}
          </NavLink>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-primary md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {isMobileOpen ? (
              <path
                d="M4 4L16 16M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 5H17M3 10H17M3 15H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-panel overflow-hidden bg-surface-0/95 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === ROUTES.home}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/[0.06] text-primary'
                        : 'text-text-secondary hover:text-text-primary',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to={isAuthenticated ? profileHref(user?.role) : ROUTES.login}
                className={buttonClasses('primary', 'md', 'mt-2')}
                onClick={() => setIsMobileOpen(false)}
              >
                {isAuthenticated ? (user?.firstName ?? 'Profile') : 'Sign In'}
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
