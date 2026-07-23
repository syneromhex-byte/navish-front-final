import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { PortfolioItem } from '@store/portfolioStore';
import { ROUTES } from '@constants/routes';

export interface ProjectCardProps {
  item: PortfolioItem;
  index?: number;
}

/** Deterministic gradient per card so the grid reads as designed, not random. */
const GRADIENTS = [
  'from-[#2a1414] via-[#120808] to-black',
  'from-[#1a1614] via-[#0d0b0a] to-black',
  'from-[#141a1e] via-[#0a0d0f] to-black',
  'from-[#1e1414] via-[#0f0808] to-black',
];

export function ProjectCard({ item, index = 0 }: ProjectCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <Link to={item.vrUrl || (item.modelUrl ? ROUTES.viewer(item.id) : '#')} className="group relative block overflow-hidden rounded-2xl">
      <div className={`aspect-[4/5] w-full bg-gradient-to-br ${gradient} relative`}>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <svg
            className="absolute inset-0 h-full w-full opacity-20 transition-opacity duration-500 group-hover:opacity-35"
            viewBox="0 0 200 250"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 220V90L100 30L180 90V220"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M60 220V140H140V220" stroke="white" strokeWidth="1.5" />
          </svg>
        )}

        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
          initial={{ opacity: 0.6 }}
          whileHover={{ opacity: 0.85 }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute inset-x-0 bottom-0 p-6 z-10">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary drop-shadow-md">
            {item.category}
          </span>
          <h3 className="mt-1.5 font-display text-xl font-semibold text-white drop-shadow-lg">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/80">{item.description}</p>
        </div>

        <div className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 translate-x-2 backdrop-blur-md">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 11L11 3M11 3H5M11 3V9"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
