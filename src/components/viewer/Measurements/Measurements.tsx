
export interface MeasurementsProps {
  className?: string;
  unit?: 'm' | 'ft';
}

export function Measurements({ className, unit = 'm' }: MeasurementsProps) {
  return (
    <div className={`glass-panel rounded-xl p-4 border border-border-subtle ${className || ''}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Scene Metrics</h4>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Measurement Tool:</span>
          <span className="font-semibold text-text-primary">Inactive</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Default Unit:</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-text-primary capitalize">{unit}</span>
        </div>
      </div>
    </div>
  );
}
