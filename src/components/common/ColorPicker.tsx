import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@utils/cn';
import { Z_INDEX } from '@constants/brand';

export interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
  className?: string;
}

const DEFAULT_PRESETS = [
  '#FFFFFF',
  '#000000',
  '#FF4D4D',
  '#8C8C8C',
  '#D9C9A8',
  '#5C4B3A',
  '#2E3B4E',
  '#3A5C46',
];

const HEX_PATTERN = /^#([0-9A-Fa-f]{6})$/;

export function ColorPicker({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftHex, setDraftHex] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraftHex(value);
  }

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

  const commitHex = (hex: string) => {
    setDraftHex(hex);
    if (HEX_PATTERN.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-1.5', className)}>
      {label && <span className="text-xs font-medium text-text-secondary">{label}</span>}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-2 px-2.5 transition-colors hover:border-border-strong"
      >
        <span
          className="h-6 w-6 shrink-0 rounded-md border border-white/10"
          style={{ backgroundColor: HEX_PATTERN.test(value) ? value : '#000000' }}
        />
        <span className="tabular text-sm text-text-primary">{value.toUpperCase()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ zIndex: Z_INDEX.overlay }}
            className="glass-panel absolute left-0 top-full mt-2 w-56 rounded-xl bg-surface-2/95 p-3 shadow-2xl"
          >
            <div className="relative h-20 w-full overflow-hidden rounded-lg border border-white/10">
              <div
                className="h-full w-full"
                style={{ backgroundColor: HEX_PATTERN.test(draftHex) ? draftHex : '#000000' }}
              />
              <input
                type="color"
                value={HEX_PATTERN.test(draftHex) ? draftHex : '#000000'}
                onChange={(event) => commitHex(event.target.value.toUpperCase())}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Pick a custom color"
              />
            </div>

            <input
              type="text"
              value={draftHex}
              onChange={(event) => commitHex(event.target.value)}
              spellCheck={false}
              placeholder="#FFFFFF"
              className={cn(
                'tabular mt-2.5 w-full rounded-lg border bg-surface-1 px-2.5 py-1.5 text-sm text-text-primary outline-none',
                HEX_PATTERN.test(draftHex) ? 'border-border-subtle' : 'border-primary/60',
                'focus:border-primary',
              )}
            />

            <div className="mt-2.5 grid grid-cols-8 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Set color to ${preset}`}
                  onClick={() => commitHex(preset)}
                  className={cn(
                    'h-5 w-5 rounded-md border transition-transform hover:scale-110',
                    preset.toUpperCase() === draftHex.toUpperCase()
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-white/10',
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
