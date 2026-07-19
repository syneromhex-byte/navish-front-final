import { Link } from 'react-router-dom';
import { ProjectCard } from '@components/cards/ProjectCard';
import { FEATURED_PROJECTS } from '@constants/marketingContent';
import { ROUTES } from '@constants/routes';

export function FeaturedProjects() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Featured Work
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
              Selected Projects
            </h2>
          </div>
          <Link
            to={ROUTES.portfolio}
            className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            View full portfolio →
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PROJECTS.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
