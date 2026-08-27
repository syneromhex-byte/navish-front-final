
export interface InspectorProps {
  className?: string;
  sceneObjectsCount?: number;
}

export function Inspector({ className, sceneObjectsCount = 0 }: InspectorProps) {
  return (
    <div className={`glass-panel rounded-xl p-4 border border-border-subtle ${className || ''}`}>
      <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Scene Inspector</h4>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {sceneObjectsCount} nodes
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin">
        <p className="text-xs text-text-tertiary">Select components in the canvas to inspect variables.</p>
      </div>
    </div>
  );
}
