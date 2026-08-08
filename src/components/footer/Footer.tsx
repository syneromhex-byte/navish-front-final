import { Link } from 'react-router-dom';
import { BRAND_CONTACT, BRAND_NAME, BRAND_TAGLINE } from '@constants/brand';
import { ROUTES } from '@constants/routes';
import { NavishLogo } from '@components/common';

const FOOTER_LINKS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Company',
    links: [
      { label: 'Portfolio', to: ROUTES.portfolio },
      { label: 'Projects', to: ROUTES.projects },
      { label: 'Services', to: ROUTES.services },
      { label: 'Contact', to: ROUTES.contact },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Sign In', to: ROUTES.login },
      { label: 'Create Account', to: ROUTES.register },
      { label: 'Dashboard', to: ROUTES.dashboard },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-surface-0">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <NavishLogo size={40} />
              <p className="font-display text-xl font-bold text-text-primary">{BRAND_NAME}</p>
            </div>
            <p className="mt-3 max-w-sm text-sm text-text-secondary">{BRAND_TAGLINE}</p>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={BRAND_CONTACT.phoneHref}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {BRAND_CONTACT.phone}
              </a>
              <a
                href={BRAND_CONTACT.emailHref}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {BRAND_CONTACT.email}
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                {column.heading}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-xs text-text-tertiary">
            © {year} {BRAND_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
