import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-btn border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-neutral transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-ring',
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
Textarea.displayName = 'Textarea';

export { Textarea };

