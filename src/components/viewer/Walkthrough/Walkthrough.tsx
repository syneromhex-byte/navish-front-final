
export interface WalkthroughProps {
  className?: string;
  onStartPlay?: () => void;
  isPlaying?: boolean;
}

export function Walkthrough({ className, onStartPlay, isPlaying = false }: WalkthroughProps) {
  return (
    <div className={`glass-panel rounded-xl p-4 border border-border-subtle ${className || ''}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Walkthrough Track</h4>
      <div className="flex items-center gap-3">
        <button
          onClick={onStartPlay}
          className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-text-primary transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play Tour'}
        </button>
        <span className="text-[10px] text-text-tertiary">0:00 / 1:30</span>
      </div>
    </div>
  );
}
