import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CardGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

export function CardGroup({
  columns = 4,
  children,
  className,
  ...props
}: CardGroupProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn('grid gap-5 lg:gap-6', colClasses[columns], className)}
      {...props}
    >
      {children}
    </div>
  );
}

