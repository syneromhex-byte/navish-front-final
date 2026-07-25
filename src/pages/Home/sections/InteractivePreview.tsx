import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';
import { gsap } from '@utils/gsap';
import { buttonClasses } from '@components/common';
import { ROUTES } from '@constants/routes';

export function InteractivePreview() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('[data-preview-frame]', {
        opacity: 0,
        y: 60,
        scale: 0.96,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Live in the Browser
        </p>
        <h2 className="mt-4 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          A full 3D editor, no install required
        </h2>
      </div>

      <div
        data-preview-frame
        className="glass-panel relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl"
      >
        <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-xs text-text-tertiary">navish-arc.app/viewer</span>
        </div>

        <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[#161010] via-black to-black">
          <svg viewBox="0 0 400 260" className="h-3/4 w-3/4 opacity-70" aria-hidden="true">
            <g stroke="white" strokeWidth="1" fill="none" opacity="0.5">
              <path d="M50 200 L50 90 L200 20 L350 90 L350 200" />
              <path d="M110 200 L110 130 L290 130 L290 200" />
              <path d="M50 90 L350 90" />
            </g>
            <g stroke="#FF4D4D" strokeWidth="1.5" fill="none">
              <rect x="150" y="150" width="100" height="50" rx="2" />
            </g>
          </svg>

          <div className="absolute right-6 top-6 flex flex-col gap-2">
            {['Material', 'Lighting', 'Transform'].map((label) => (
              <span
                key={label}
                className="glass-panel rounded-lg px-3 py-1.5 text-xs text-text-secondary"
              >
                {label}
              </span>
            ))}
          </div>

          <Link
            to={ROUTES.viewer('meridian-residence')}
            className={buttonClasses('primary', 'md', 'absolute bottom-6')}
          >
            Launch Full Viewer
          </Link>
        </div>
      </div>
    </section>
  );
}
