import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-muted text-text-primary border border-border',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-text-secondary',
        outline: 'border border-border text-text-secondary',
        success: 'bg-success-tint text-success-dark border border-success/20',
        warning: 'bg-warning-tint text-warning-dark border border-warning/20',
        error: 'bg-error-tint text-error-dark border border-error/20',
      },
      shape: {
        tag: 'rounded-tag text-xs px-2 py-0.5',
        pill: 'rounded-full text-xs px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      shape: 'pill',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, shape }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

