'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface DataTableToolbarProps {
  searchSlot?: React.ReactNode;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar({
  searchSlot,
  filterSlot,
  actionsSlot,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {searchSlot && <div className="w-full sm:max-w-xs">{searchSlot}</div>}
        {filterSlot && <div className="flex items-center gap-2">{filterSlot}</div>}
      </div>
      {actionsSlot && (
        <div className="flex items-center gap-2 shrink-0">{actionsSlot}</div>
      )}
    </div>
  );
}

