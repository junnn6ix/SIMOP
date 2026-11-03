import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/cn';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'form' | 'list';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = 'card',
  count = 3,
  className,
}: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-btn" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        className={cn(
          'rounded-card border border-border bg-surface p-4 space-y-4',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48 rounded-btn" />
          <Skeleton className="h-9 w-24 rounded-btn" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-btn" />
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-btn" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <Card className={cn('p-6 space-y-6', className)}>
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-btn" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Skeleton className="h-9 w-20 rounded-btn" />
          <Skeleton className="h-9 w-24 rounded-btn" />
        </div>
      </Card>
    );
  }

  // list
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface divide-y divide-border',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

