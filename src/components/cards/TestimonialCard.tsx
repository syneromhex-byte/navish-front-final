import type { Testimonial } from '@app-types/content.types';

export interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="glass-panel flex h-full flex-col justify-between rounded-2xl p-8">
      <svg
        width="28"
        height="22"
        viewBox="0 0 28 22"
        fill="none"
        className="text-primary"
        aria-hidden="true"
      >
        <path
          d="M11.6 0.8C6.4 2.4 2.8 6.8 2.8 12.4C2.8 16.8 5.6 20 9.6 20C12.8 20 15.2 17.6 15.2 14.4C15.2 11.6 13.2 9.6 10.8 9.6C10 9.6 9.2 9.8 8.8 10C9.2 6.8 12 3.6 15.2 2.4L11.6 0.8ZM24.4 0.8C19.2 2.4 15.6 6.8 15.6 12.4C15.6 16.8 18.4 20 22.4 20C25.6 20 28 17.6 28 14.4C28 11.6 26 9.6 23.6 9.6C22.8 9.6 22 9.8 21.6 10C22 6.8 24.8 3.6 28 2.4L24.4 0.8Z"
          fill="currentColor"
        />
      </svg>
      <p className="mt-4 flex-1 text-base leading-relaxed text-text-primary">{testimonial.quote}</p>
      <div className="mt-6 border-t border-border-subtle pt-4">
        <p className="text-sm font-semibold text-text-primary">{testimonial.author}</p>
        <p className="text-xs text-text-tertiary">{testimonial.role}</p>
      </div>
    </div>
  );
}
