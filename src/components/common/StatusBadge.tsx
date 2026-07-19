import { cn } from '@utils/cn';
import type { ProjectStatus } from '@app-types/project.types';

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: 'bg-white/10 text-text-secondary',
  processing: 'bg-amber-500/10 text-amber-400',
  ready: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-primary/10 text-primary',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
