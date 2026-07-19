import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';
import { gsap } from '@utils/gsap';
import { buttonClasses } from '@components/common';
import { ROUTES } from '@constants/routes';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      timeline
        .from('[data-hero-eyebrow]', { opacity: 0, y: 16, duration: 0.6 })
        .from('[data-hero-line]', { opacity: 0, y: 40, duration: 0.8, stagger: 0.1 }, '-=0.3')
        .from('[data-hero-sub]', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
        .from('[data-hero-cta]', { opacity: 0, y: 20, duration: 0.6, stagger: 0.08 }, '-=0.35');

      gsap.to('[data-hero-grid]', {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="relative flex min-h-screen items-center overflow-hidden">
      <div
        data-hero-grid
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-0" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <p
          data-hero-eyebrow
          className="text-xs font-semibold uppercase tracking-[0.25em] text-primary"
        >
          Architectural Visualization, Reimagined
        </p>

        <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-7xl">
          <span data-hero-line className="block">
            Every space,
          </span>
          <span data-hero-line className="block">
            before it&apos;s built.
          </span>
        </h1>

        <p data-hero-sub className="mx-auto mt-6 max-w-xl text-base text-text-secondary sm:text-lg">
          Walk through, customize, and present real-time 3D interiors — in the browser, on mobile,
          or in VR.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link data-hero-cta to={ROUTES.portfolio} className={buttonClasses('primary', 'lg')}>
            Explore Portfolio
          </Link>
          <Link
            data-hero-cta
            to={ROUTES.viewer('meridian-residence')}
            className={buttonClasses('outline', 'lg')}
          >
            Launch Demo Viewer
          </Link>
        </div>
      </div>
    </section>
  );
}
