import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolioStore } from '@store/portfolioStore';
import { ROUTES } from '@constants/routes';
import { formatBytes } from '@utils/format';

const SHOWCASE_CATEGORIES = ['Residential', 'Commercial', 'Interior', 'Hospitality', 'Landscape'];
const CATEGORY_FILTERS = ['All', ...SHOWCASE_CATEGORIES];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('All');
  const items = usePortfolioStore((state) => state.items);

  const publicItems = useMemo(() => items.filter((item) => item.isPublic), [items]);

  const filteredProjects =
    activeCategory === 'All'
      ? publicItems
      : publicItems.filter((project) => project.category === activeCategory);

  return (
    <section className="px-6 pb-24 pt-40">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Case Studies
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          How each project came together
        </h1>

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

        {filteredProjects.length === 0 ? (
          <p className="mt-10 text-sm text-text-secondary">No case studies in this category yet.</p>
        ) : (
          <div className="mt-10 flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
            {filteredProjects.map((project) => {
              const href = project.vrUrl || (project.modelUrl ? ROUTES.viewer(project.id) : '#');
              return (
                <Link
                  key={project.id}
                  to={href}
                  className="group flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                      {project.category}
                    </span>
                    <h2 className="mt-1.5 font-display text-2xl font-semibold text-text-primary transition-colors group-hover:text-primary">
                      {project.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-text-secondary">{project.description}</p>
                  </div>

                  <div className="flex shrink-0 gap-8">
                    {project.sizeBytes && (
                      <div>
                        <p className="tabular text-lg font-semibold text-text-primary">{formatBytes(project.sizeBytes)}</p>
                        <p className="text-xs text-text-tertiary">Model Size</p>
                      </div>
                    )}
                    {project.format && (
                      <div>
                        <p className="tabular text-lg font-semibold text-text-primary uppercase">{project.format}</p>
                        <p className="text-xs text-text-tertiary">Format</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
