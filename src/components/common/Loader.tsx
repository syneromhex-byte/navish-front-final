import { cn } from '@utils/cn';

export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps {
  size?: LoaderSize;
  label?: string;
  className?: string;
  /** 0–100. Omit for an indeterminate spinner. */
  progress?: number;
}

const SIZE_PX: Record<LoaderSize, number> = { sm: 16, md: 28, lg: 44 };

export function Loader({ size = 'md', label, className, progress }: LoaderProps) {
  const px = SIZE_PX[size];
  const isDeterminate = typeof progress === 'number';

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        role="status"
        aria-label={label ?? 'Loading'}
        aria-valuenow={isDeterminate ? Math.round(progress) : undefined}
        style={{ width: px, height: px }}
        className="relative"
      >
        <svg
          viewBox="0 0 44 44"
          className={cn('h-full w-full -rotate-90', !isDeterminate && 'animate-spin')}
        >
          <circle cx="22" cy="22" r="19" fill="none" strokeWidth="3" className="stroke-white/10" />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-primary"
            style={{
              strokeDasharray: 2 * Math.PI * 19,
              strokeDashoffset: isDeterminate
                ? 2 * Math.PI * 19 * (1 - progress / 100)
                : 2 * Math.PI * 19 * 0.75,
              transition: isDeterminate ? 'stroke-dashoffset 0.2s ease-out' : undefined,
            }}
          />
        </svg>
        {isDeterminate && (
          <span className="tabular absolute inset-0 flex items-center justify-center text-[10px] text-text-secondary">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      {label && <p className="text-xs text-text-secondary">{label}</p>}
    </div>
  );
}
