import { Link } from 'react-router-dom';
import { ServiceCard } from '@components/cards/ServiceCard';
import { buttonClasses } from '@components/common';
import { SERVICES } from '@constants/marketingContent';
import { ROUTES } from '@constants/routes';

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Capture or Model',
    description: 'We scan your existing space or build from architectural drawings.',
  },
  {
    step: '02',
    title: 'Material Pass',
    description: 'Every surface gets a physically-based material matched to real finishes.',
  },
  {
    step: '03',
    title: 'Light & Optimize',
    description: 'HDR lighting, baked shadows, and LOD passes for a smooth 60fps experience.',
  },
  {
    step: '04',
    title: 'Deliver',
    description: 'Share a link — browser, mobile, or VR headset, no install required.',
  },
];

export default function Services() {
  return (
    <section className="px-6 pb-24 pt-40">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Services</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          From blueprint to walkthrough
        </h1>
        <p className="mt-4 max-w-xl text-text-secondary">
          Everything required to turn architectural plans into a real-time, explorable 3D
          experience.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      <div className="mx-auto mt-24 max-w-5xl">
        <h2 className="font-display text-2xl font-semibold text-text-primary">Our Process</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((item) => (
            <div key={item.step}>
              <p className="font-display text-3xl font-semibold text-primary">{item.step}</p>
              <h3 className="mt-3 text-base font-semibold text-text-primary">{item.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-5xl text-center">
        <Link to={ROUTES.contact} className={buttonClasses('primary', 'lg')}>
          Start a Project
        </Link>
      </div>
    </section>
  );
}
