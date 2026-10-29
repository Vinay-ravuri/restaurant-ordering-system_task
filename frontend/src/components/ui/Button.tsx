import React from 'react';
import { cn } from '../../lib/utils.js';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 min-h-[44px] cursor-pointer select-none';

    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm hover:shadow',
      secondary:
        'bg-secondary text-foreground hover:bg-secondary-hover focus-visible:ring-muted',
      outline:
        'border border-border bg-transparent text-foreground hover:bg-muted-background focus-visible:ring-primary',
      ghost:
        'bg-transparent text-foreground hover:bg-muted-background focus-visible:ring-primary',
      danger:
        'bg-danger text-white hover:bg-red-700 focus-visible:ring-danger shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[38px] rounded-lg',
      md: 'text-sm px-4 py-2.5 min-h-[44px]',
      lg: 'text-base px-6 py-3 min-h-[50px] rounded-2xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
