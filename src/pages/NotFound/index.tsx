import { Link } from 'react-router-dom';
import { buttonClasses } from '@components/common';
import { ROUTES } from '@constants/routes';

export default function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-0 px-6 text-center">
      <p className="font-display text-6xl font-semibold text-primary">404</p>
      <p className="text-sm text-text-secondary">This page doesn&apos;t exist.</p>
      <Link to={ROUTES.home} className={buttonClasses('primary', 'md', 'mt-2')}>
        Back to Home
      </Link>
    </section>
  );
}
