import { ServiceCard } from '@components/cards/ServiceCard';
import { SERVICES } from '@constants/marketingContent';

export function ServicesSection() {
  return (
    <section className="border-y border-border-subtle bg-surface-1/40 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            What We Do
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            End-to-end architectural visualization
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
