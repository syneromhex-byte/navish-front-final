import { useState } from 'react';
import { ProjectCard } from '@components/cards/ProjectCard';
import { FEATURED_PROJECTS, SHOWCASE_CATEGORIES } from '@constants/marketingContent';

const CATEGORY_FILTERS = ['All', ...SHOWCASE_CATEGORIES];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProjects =
    activeCategory === 'All'
      ? FEATURED_PROJECTS
      : FEATURED_PROJECTS.filter((project) => project.category === activeCategory);

  return (
    <section className="px-6 pb-24 pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Portfolio
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-text-primary sm:text-5xl">
            Spaces we&apos;ve visualized
          </h1>
          <p className="mt-4 text-text-secondary">
            A selection of residential, commercial, and hospitality projects brought to life in
            fully interactive 3D.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={
                category === activeCategory
                  ? 'rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full border border-border-subtle px-4 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary'
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
