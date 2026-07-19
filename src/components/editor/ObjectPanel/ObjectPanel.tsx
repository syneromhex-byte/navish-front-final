import { cn } from '@utils/cn';
import type { SceneObjectCategory } from '@engine/babylon/ObjectManager';

export interface ObjectPanelEntry {
  id: string;
  name: string;
  category: SceneObjectCategory;
}

export interface ObjectPanelProps {
  objects: ObjectPanelEntry[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

const CATEGORY_LABELS: Record<SceneObjectCategory, string> = {
  wall: 'Walls',
  floor: 'Floors',
  furniture: 'Furniture',
  door: 'Doors',
  window: 'Windows',
  other: 'Other',
};

const CATEGORY_ORDER: SceneObjectCategory[] = [
  'floor',
  'wall',
  'door',
  'window',
  'furniture',
  'other',
];

export function ObjectPanel({ objects, selectedIds, onSelect }: ObjectPanelProps) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: objects.filter((object) => object.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="glass-panel scrollbar-thin absolute left-4 top-4 max-h-[calc(100%-2rem)] w-56 overflow-y-auto rounded-2xl p-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-text-tertiary">
        Scene
      </p>
      {objects.length === 0 ? (
        <p className="mt-3 px-1 text-xs text-text-tertiary">No objects loaded.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className="px-1 text-[11px] font-medium text-text-tertiary">
                {CATEGORY_LABELS[group.category]}
              </p>
              <div className="mt-1 flex flex-col gap-0.5">
                {group.items.map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    onClick={() => onSelect(object.id)}
                    className={cn(
                      'truncate rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                      selectedIds.includes(object.id)
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary',
                    )}
                  >
                    {object.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
