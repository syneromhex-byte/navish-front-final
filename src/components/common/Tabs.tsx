import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@utils/cn';

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ items, defaultValue, value, onValueChange, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? '');
  const activeValue = value ?? internalValue;
  const layoutId = useId();

  const setActiveValue = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  const activeItem = items.find((item) => item.value === activeValue);

  return (
    <div className={className}>
      <div
        role="tablist"
        className="scrollbar-thin flex items-center gap-1 overflow-x-auto border-b border-border-subtle"
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === activeValue}
            disabled={item.disabled}
            onClick={() => setActiveValue(item.value)}
            className={cn(
              'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
              'disabled:pointer-events-none disabled:opacity-40',
              item.value === activeValue
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {item.label}
            {item.value === activeValue && (
              <motion.span
                layoutId={`tab-underline-${layoutId}`}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {activeItem?.content}
      </div>
    </div>
  );
}
