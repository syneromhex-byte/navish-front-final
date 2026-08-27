import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@utils/cn';
import { Z_INDEX } from '@constants/brand';

export interface DropdownItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  /** Which side of the trigger the menu opens on. Use 'top' when the trigger sits near the bottom of the viewport. */
  placement?: 'top' | 'bottom';
  className?: string;
  /** Notified whenever the menu opens or closes — lets a parent hide other floating panels that would otherwise sit under it. */
  onOpenChange?: (isOpen: boolean) => void;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  placement = 'bottom',
  className,
  onOpenChange,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const enabledIndexes = items.reduce<number[]>((acc, item, index) => {
    if (!item.disabled) acc.push(index);
    return acc;
  }, []);

  const moveActive = (direction: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const currentPos = enabledIndexes.indexOf(activeIndex);
    const nextPos = (currentPos + direction + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPos] ?? -1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      const item = items[activeIndex];
      if (item) {
        onSelect(item.value);
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: placement === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: placement === 'top' ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            style={{ zIndex: Z_INDEX.overlay }}
            className={cn(
              'glass-panel absolute min-w-[180px] rounded-xl bg-surface-2/95 p-1.5 shadow-2xl',
              placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
              align === 'right' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {items.map((item, index) => (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  onSelect(item.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  'disabled:pointer-events-none disabled:opacity-40',
                  item.destructive ? 'text-primary' : 'text-text-primary',
                  activeIndex === index ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
