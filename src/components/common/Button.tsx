import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses } from './buttonVariants';
import type { ButtonSize, ButtonVariant } from './buttonVariants';

export type { ButtonVariant, ButtonSize } from './buttonVariants';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? isLoading}
        className={buttonClasses(variant, size, className)}
        {...props}
      >
        {isLoading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}
        {size !== 'icon' && children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
