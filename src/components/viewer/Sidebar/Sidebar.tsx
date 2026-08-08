
export interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
}

export function Sidebar({ className, children }: SidebarProps) {
  return (
    <div className={`glass-panel flex flex-col border-r border-border-subtle bg-surface-1/50 p-4 ${className || ''}`}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Viewer Sidebar</h3>
      {children || <p className="text-xs text-text-tertiary">Select an object or view settings.</p>}
    </div>
  );
}
