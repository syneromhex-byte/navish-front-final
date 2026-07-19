import { cn } from '@utils/cn';
import { formatBytes } from '@utils/format';
import type { UploadProgress as UploadProgressData, ProcessingStep } from '@app-types/project.types';

export interface UploadProgressProps {
  data: UploadProgressData;
  className?: string;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '—';
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '—';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

function StepIcon({ status }: { status: ProcessingStep['status'] }) {
  if (status === 'complete') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400">
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'active') {
    return (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    );
  }
  if (status === 'error') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary">
        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return <span className="h-4 w-4 rounded-full border-2 border-white/10" />;
}

export function UploadProgressDisplay({ data, className }: UploadProgressProps) {
  const isUploading = data.status === 'uploading';
  const isProcessing = data.status === 'processing';
  const isComplete = data.status === 'complete';
  const isError = data.status === 'error';

  return (
    <div className={cn('flex flex-col gap-4 rounded-2xl', className)}>
      {/* File name and status */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          isComplete ? 'bg-emerald-500/15 text-emerald-400' :
          isError ? 'bg-primary/15 text-primary' :
          'bg-primary/15 text-primary',
        )}>
          {isComplete ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5L8 14.5L16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : isError ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M17 12.5v3.333A1.667 1.667 0 0 1 15.333 17.5H4.667a1.667 1.667 0 0 1-1.667-1.667V12.5M13.333 6.667 10 3.333 6.667 6.667M10 3.333v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{data.fileName}</p>
          <p className="text-xs text-text-tertiary">
            {isComplete ? 'Upload complete' :
             isError ? (data.error ?? 'Upload failed') :
             isProcessing ? 'Processing…' :
             'Uploading…'}
          </p>
        </div>
        {isUploading && (
          <span className="tabular text-sm font-semibold text-primary">{Math.round(data.percent)}%</span>
        )}
      </div>

      {/* Progress bar */}
      {(isUploading || isProcessing) && (
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              isProcessing
                ? 'bg-gradient-to-r from-primary via-violet-500 to-primary animate-pulse'
                : 'bg-gradient-to-r from-primary to-primary/80',
            )}
            style={{ width: `${Math.max(data.percent, 2)}%` }}
          />
        </div>
      )}

      {/* Upload stats */}
      {isUploading && (data.uploadedBytes != null || data.speed != null) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-tertiary">
          {data.uploadedBytes != null && data.totalBytes != null && (
            <span className="tabular">
              {formatBytes(data.uploadedBytes)} / {formatBytes(data.totalBytes)}
            </span>
          )}
          {data.speed != null && (
            <span className="tabular">Speed: {formatSpeed(data.speed)}</span>
          )}
          {data.remainingMs != null && (
            <span className="tabular">Remaining: {formatTime(data.remainingMs)}</span>
          )}
        </div>
      )}

      {/* Processing pipeline */}
      {isProcessing && data.processingSteps && data.processingSteps.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-white/[0.03] p-4">
          {data.processingSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <StepIcon status={step.status} />
              <span
                className={cn(
                  'text-xs',
                  step.status === 'complete' ? 'text-text-secondary' :
                  step.status === 'active' ? 'text-text-primary font-medium' :
                  step.status === 'error' ? 'text-primary' :
                  'text-text-tertiary',
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && data.error && (
        <p className="text-xs text-primary">{data.error}</p>
      )}
    </div>
  );
}
