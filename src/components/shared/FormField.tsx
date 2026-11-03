import * as React from 'react';
import { cn } from '@/lib/cn';

export interface FormFieldProps {
  id?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id: explicitId,
  label,
  description,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const generatedId = React.useId();
  const id = explicitId || generatedId;
  const descriptionId = `${id}-desc`;
  const errorId = `${id}-error`;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-text-primary"
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}

      {/* Render children, injecting aria attributes if child is single cloneable element */}
      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string; error?: boolean }>, {
              id: (children.props as { id?: string }).id || id,
              'aria-describedby': error ? errorId : description ? descriptionId : undefined,
              error: Boolean(error),
            })
          : children}
      </div>

      {description && !error && (
        <p id={descriptionId} className="text-xs text-text-secondary">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

