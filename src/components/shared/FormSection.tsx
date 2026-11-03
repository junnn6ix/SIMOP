import * as React from 'react';
import { cn } from '@/lib/cn';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4 pt-4 first:pt-0', className)}>
      <div className="space-y-0.5 pb-2 border-b border-border">
        <h4 className="text-sm font-bold font-display text-text-primary">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-text-secondary">{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

