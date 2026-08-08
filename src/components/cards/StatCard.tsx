import type { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className="tabular mt-3 font-display text-3xl font-semibold text-text-primary">{value}</p>
      {trend && <p className="mt-1 text-xs text-text-secondary">{trend}</p>}
    </div>
  );
}
