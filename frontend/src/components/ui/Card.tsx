import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl border border-border p-5 transition-all duration-200',
        elevated ? 'shadow-elevated' : 'shadow-soft hover:shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
