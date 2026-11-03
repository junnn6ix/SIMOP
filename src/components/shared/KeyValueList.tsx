import * as React from 'react';
import { cn } from '@/lib/cn';

export interface KeyValueItem {
  label: string;
  value: React.ReactNode;
  hint?: string;
  badge?: React.ReactNode;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  dense?: boolean;
  className?: string;
}

export function KeyValueList({
  items,
  dense = false,
  className,
}: KeyValueListProps) {
  return (
    <div
      className={cn(
        'divide-y divide-border rounded-panel border border-border bg-surface overflow-hidden',
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 hover:bg-muted/30 transition-colors',
            dense ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
          )}
        >
          <div className="space-y-0.5">
            <span className="font-medium text-text-secondary">
              {item.label}
            </span>
            {item.hint && (
              <p className="text-[11px] text-text-secondary">{item.hint}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary text-right">
              {item.value || '-'}
            </span>
            {item.badge && <span>{item.badge}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

