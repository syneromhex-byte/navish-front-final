import { Link } from 'react-router-dom';
import { buttonClasses } from '@components/common';
import { ROUTES } from '@constants/routes';

export function ContactCTA() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="glass-panel relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]"
          aria-hidden="true"
        />
        <h2 className="relative font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          Ready to visualize your next project?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-text-secondary">
          Bring your architectural plans into a fully interactive 3D experience — walk through,
          customize, and share before a single wall goes up.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to={ROUTES.contact} className={buttonClasses('primary', 'lg')}>
            Get in Touch
          </Link>
          <Link to={ROUTES.services} className={buttonClasses('outline', 'lg')}>
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  );
}
