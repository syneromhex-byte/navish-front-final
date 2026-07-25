
export interface MiniMapProps {
  className?: string;
  isVisible?: boolean;
}

export function MiniMap({ className, isVisible = true }: MiniMapProps) {
  if (!isVisible) return null;

  return (
    <div className={`glass-panel overflow-hidden rounded-xl border border-border-subtle ${className || ''}`}>
      <div className="flex h-32 w-32 items-center justify-center bg-surface-1/40">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
          <path
            d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
