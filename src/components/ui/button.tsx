import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium select-none rounded-btn transition-all duration-150 btn-lift focus-ring disabled:pointer-events-none disabled:opacity-50 disabled:transform-none disabled:shadow-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover btn-primary-glow',
        secondary:
          'bg-transparent border border-border text-text-primary hover:bg-muted hover:border-text-neutral',
        ghost:
          'bg-transparent text-text-secondary hover:text-text-primary hover:bg-muted',
        destructive:
          'bg-transparent border border-error text-error hover:bg-error-tint',
        link:
          'text-primary underline-offset-4 hover:underline p-0 h-auto btn-lift-none',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-[38px] px-4 text-sm gap-2',
        lg: 'h-11 px-6 text-base gap-2.5',
        icon: 'h-[38px] w-[38px] p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

