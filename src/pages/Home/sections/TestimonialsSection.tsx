import { TestimonialCard } from '@components/cards/TestimonialCard';
import { TESTIMONIALS } from '@constants/marketingContent';

export function TestimonialsSection() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Trusted By Architects
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            What our clients say
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
