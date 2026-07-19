import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 5, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error}
          className={cn(
            'scrollbar-thin resize-none rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors',
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

Textarea.displayName = 'Textarea';
