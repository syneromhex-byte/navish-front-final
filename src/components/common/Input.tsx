import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            'h-10 rounded-lg border bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors',
            'focus:border-primary',
            error ? 'border-primary/60' : 'border-border-subtle',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-primary">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
