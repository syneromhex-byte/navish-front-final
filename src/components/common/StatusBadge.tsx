import { cn } from '@utils/cn';
import type { ProjectStatus, ModelStatus } from '@app-types/project.types';

type BadgeStatus = ProjectStatus | ModelStatus;

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-white/10 text-text-secondary',
  uploading: 'bg-sky-500/10 text-sky-400',
  processing: 'bg-amber-500/10 text-amber-400',
  optimizing: 'bg-violet-500/10 text-violet-400',
  'generating-thumbnail': 'bg-indigo-500/10 text-indigo-400',
  ready: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-primary/10 text-primary',
  complete: 'bg-emerald-500/10 text-emerald-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  uploading: 'Uploading',
  processing: 'Processing',
  optimizing: 'Optimizing',
  'generating-thumbnail': 'Generating Thumbnail',
  ready: 'Ready',
  failed: 'Failed',
  complete: 'Complete',
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-white/10 text-text-secondary',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
