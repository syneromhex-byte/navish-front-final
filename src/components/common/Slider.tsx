import { useId } from 'react';
import type { CSSProperties } from 'react';
import { cn } from '@utils/cn';

export interface SliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
  className?: string;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  min = 0,
  max = 1,
  step = 0.01,
  value,
  onChange,
  unit = '',
  disabled = false,
  className,
  formatValue,
}: SliderProps) {
  const inputId = useId();
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
          <span className="tabular text-xs font-medium text-text-primary">
            {formatValue ? formatValue(value) : value.toFixed(2)}
            {unit}
          </span>
        </div>
      )}
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="navish-slider"
        style={{ '--slider-fill': `${fillPercent}%` } as CSSProperties}
      />
    </div>
  );
}
