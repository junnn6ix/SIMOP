import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-[38px] w-full rounded-btn border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-neutral transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-ring',
          error && 'border-error focus:border-error focus:shadow-none focus:ring-2 focus:ring-error',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

