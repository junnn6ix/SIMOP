import * as React from 'react';
import { DotGrid } from '@/components/shared/DotGrid';
import { cn } from '@/lib/cn';

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background overflow-hidden">
      <DotGrid />
      <div
        className={cn(
          'relative z-10 w-full max-w-md space-y-6',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

