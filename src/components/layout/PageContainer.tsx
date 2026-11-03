import * as React from 'react';
import { cn } from '@/lib/cn';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-container px-6 py-6 md:py-8', className)}
      {...props}
    >
      {children}
    </div>
  );
}

