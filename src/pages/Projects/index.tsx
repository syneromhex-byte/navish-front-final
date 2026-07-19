import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURED_PROJECTS, SHOWCASE_CATEGORIES } from '@constants/marketingContent';

const CASE_STUDY_NOTES: Record<string, { summary: string; stats: [string, string][] }> = {
  'meridian-residence': {
    summary: 'A 6,200 sq ft mountain residence, fully modeled from CAD before construction began.',
    stats: [
      ['Turnaround', '3 weeks'],
      ['Assets', '412 objects'],
    ],
  },
  'obsidian-loft': {
    summary: 'Point-cloud scan of an existing loft, used to pre-visualize a full renovation.',
    stats: [
      ['Turnaround', '9 days'],
      ['Assets', '188 objects'],
    ],
  },
  'harbor-pavilion': {
    summary: 'Mixed-use commercial pavilion presented to investors as a VR walkthrough.',
    stats: [
      ['Turnaround', '5 weeks'],
      ['Assets', '760 objects'],
    ],
  },
  'linden-house': {
    summary: 'Material-first project — client selected every finish inside the live viewer.',
    stats: [
      ['Turnaround', '2 weeks'],
      ['Assets', '265 objects'],
    ],
  },
};

const CATEGORY_FILTERS = ['All', ...SHOWCASE_CATEGORIES];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProjects =
    activeCategory === 'All'
      ? FEATURED_PROJECTS
      : FEATURED_PROJECTS.filter((project) => project.category === activeCategory);

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
              const notes = CASE_STUDY_NOTES[project.id];
              return (
                <Link
                  key={project.id}
                  to={project.href}
                  className="group flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                      {project.category}
                    </span>
                    <h2 className="mt-1.5 font-display text-2xl font-semibold text-text-primary transition-colors group-hover:text-primary">
                      {project.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-text-secondary">{notes?.summary}</p>
                  </div>

                  <div className="flex shrink-0 gap-8">
                    {notes?.stats.map(([label, value]) => (
                      <div key={label}>
                        <p className="tabular text-lg font-semibold text-text-primary">{value}</p>
                        <p className="text-xs text-text-tertiary">{label}</p>
                      </div>
                    ))}
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
