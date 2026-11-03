import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card border border-dashed border-border bg-surface/50',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-text-secondary mb-4">
        {icon || <Inbox className="h-6 w-6 stroke-[1.5]" />}
      </div>
      <h4 className="text-base font-bold font-display text-text-primary">
        {title}
      </h4>
      {description && (
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-text-secondary">
          {description}
        </p>
      )}
      {actions && <div className="mt-5">{actions}</div>}
    </div>
  );
}

