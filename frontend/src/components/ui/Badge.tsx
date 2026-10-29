import React from 'react';
import { cn } from '../../lib/utils.js';
import type { OrderStatus, OrderType } from '../../types/index.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'status' | 'dietary';
  status?: OrderStatus;
  orderType?: OrderType;
  dietary?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'CONTAINS_EGG' | string | null;
}

export function Badge({
  className,
  variant = 'default',
  status,
  orderType,
  dietary,
  children,
  ...props
}: BadgeProps) {
  // If status is provided, automatically apply appropriate status styles
  if (status) {
    const statusConfig: Record<OrderStatus, { bg: string; text: string; label: string; dot: string }> = {
      RECEIVED: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        label: 'Received',
        dot: 'bg-blue-500',
      },
      PREPARING: {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-800',
        label: 'Preparing',
        dot: 'bg-amber-500 animate-pulse',
      },
      READY: {
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-800',
        label: 'Ready for Pickup',
        dot: 'bg-emerald-500',
      },
      SERVED: {
        bg: 'bg-stone-100 border-stone-200',
        text: 'text-stone-700',
        label: 'Served',
        dot: 'bg-stone-400',
      },
    };

    const config = statusConfig[status];

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
          config.bg,
          config.text,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
        {children || config.label}
      </span>
    );
  }

  // Dietary badges
  if (dietary) {
    const isVeg = dietary === 'VEG' || dietary === 'VEGAN';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium tracking-tight',
          isVeg
            ? 'border-emerald-600/40 text-emerald-800 bg-emerald-50/50'
            : 'border-red-600/40 text-red-800 bg-red-50/50',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isVeg ? 'bg-emerald-600' : 'bg-red-600'
          )}
        />
        {dietary === 'VEG' ? 'VEG' : dietary === 'NON_VEG' ? 'NON-VEG' : dietary}
      </span>
    );
  }

  // Order type badges
  if (orderType) {
    const isDineIn = orderType === 'DINE_IN';
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider',
          isDineIn
            ? 'bg-primary-light text-primary border border-primary/20'
            : 'bg-secondary text-foreground border border-border',
          className
        )}
        {...props}
      >
        {isDineIn ? 'Dine-In' : 'Takeaway'}
      </span>
    );
  }

  const variants = {
    default: 'bg-secondary text-foreground border border-border',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-800 border border-red-200',
    outline: 'border border-border text-foreground bg-transparent',
    status: 'bg-secondary text-foreground',
    dietary: 'bg-secondary text-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
