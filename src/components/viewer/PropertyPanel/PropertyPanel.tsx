import React from 'react';

export interface PropertyPanelProps {
  className?: string;
  selectedId?: string;
  children?: React.ReactNode;
}

export function PropertyPanel({ className, selectedId, children }: PropertyPanelProps) {
  return (
    <div className={`glass-panel rounded-xl p-4 border border-border-subtle ${className || ''}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Properties</h4>
      {selectedId ? (
        children || (
          <div className="text-xs text-text-secondary">
            <span className="text-text-tertiary">Selected node:</span> {selectedId}
          </div>
        )
      ) : (
        <p className="text-xs text-text-tertiary">No selection made. Click an object to edit properties.</p>
      )}
    </div>
  );
}
