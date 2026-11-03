'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({
  children,
  onReset,
  hasActiveFilters = false,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2.5 p-3 rounded-panel border border-border bg-surface',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {children}
      </div>

      {hasActiveFilters && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 px-2.5 text-xs text-text-secondary hover:text-text-primary"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          <span>Reset Filter</span>
        </Button>
      )}
    </div>
  );
}

