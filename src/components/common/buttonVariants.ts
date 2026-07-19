import { cn } from '@utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-[0_0_0_1px_rgba(255,77,77,0.4)]',
  secondary: 'glass-panel text-text-primary hover:bg-white/[0.08]',
  outline:
    'border border-border-strong text-text-primary hover:border-primary hover:text-primary bg-transparent',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06] bg-transparent',
  danger: 'border border-primary/40 text-primary hover:bg-primary/10 bg-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
};

/**
 * Shared visual classes for anything that needs to *look* like a Button but
 * can't be a native <button> — e.g. a react-router `NavLink` used as a CTA.
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    'disabled:pointer-events-none disabled:opacity-40',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}
