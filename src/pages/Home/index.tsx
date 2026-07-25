import { Hero } from './sections/Hero';
import { InteractivePreview } from './sections/InteractivePreview';
import { FeaturedProjects } from './sections/FeaturedProjects';
import { ServicesSection } from './sections/ServicesSection';
import { TechnologyStrip } from './sections/TechnologyStrip';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { ContactCTA } from './sections/ContactCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <InteractivePreview />
      <FeaturedProjects />
      <ServicesSection />
      <TechnologyStrip />
      <TestimonialsSection />
      <ContactCTA />
    </>
  );
}
