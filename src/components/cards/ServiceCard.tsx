import type { ReactNode } from 'react';
import type { ServiceSummary } from '@app-types/content.types';

const ICONS: Record<ServiceSummary['icon'], ReactNode> = {
  scan: (
    <path
      d="M6 4H4v2M18 4h2v2M6 20H4v-2M18 20h2v-2M4 10v4M20 10v4M9 12h6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  cube: (
    <path
      d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z M4 7.5L12 12M12 12L20 7.5M12 12V21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  headset: (
    <path
      d="M4 13V11a8 8 0 0 1 16 0v2M4 13v4a2 2 0 0 0 2 2h1v-6H5a1 1 0 0 0-1 1ZM20 13v4a2 2 0 0 1-2 2h-1v-6h2a1 1 0 0 1 1 1Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  palette: (
    <path
      d="M12 21a9 9 0 1 1 0-18 8 8 0 0 1 8 8c0 1.5-1 2.5-2.5 2.5H15a1.5 1.5 0 0 0-1 2.6c.4.4.6.9.6 1.4 0 1.4-1.2 2.5-2.6 2.5Z M7.5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM9.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM14.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export interface ServiceCardProps {
  service: ServiceSummary;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 transition-colors duration-300 hover:bg-white/[0.06]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {ICONS[service.icon]}
        </svg>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{service.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{service.description}</p>
    </div>
  );
}
