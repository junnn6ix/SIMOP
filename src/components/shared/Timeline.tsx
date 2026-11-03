import * as React from 'react';
import { StatusBadge, SimopStatus } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/cn';

export interface TimelineItem {
  id: string;
  title: string;
  timestamp: string;
  status?: SimopStatus;
  description?: string;
  location?: string;
  officer?: string;
  actions?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  emptyMessage?: string;
  className?: string;
}

export function Timeline({
  items,
  emptyMessage = 'Belum ada agenda jadwal.',
  className,
}: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-text-secondary">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn('relative pl-6 space-y-6', className)}>
      {/* Vertical timeline line */}
      <div
        className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border"
        aria-hidden="true"
      />

      {items.map((item) => (
        <div key={item.id} className="relative group">
          {/* Status Dot */}
          <div
            className={cn(
              'absolute -left-[19px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-primary ring-2 ring-primary/20',
              item.status === 'SELESAI' && 'bg-success ring-success/20',
              item.status === 'MENUNGGU_VERIFIKASI' && 'bg-warning ring-warning/20',
              item.status === 'BELUM_DIKERJAKAN' && 'bg-text-secondary ring-neutral/20'
            )}
            aria-hidden="true"
          />

          <div className="rounded-panel border border-border bg-surface p-4 shadow-sm hover:border-text-neutral/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-text-primary font-display">
                  {item.title}
                </h4>
                {item.status && <StatusBadge status={item.status} />}
              </div>
              <span className="text-xs font-mono text-text-secondary">
                {item.timestamp}
              </span>
            </div>

            {(item.description || item.location || item.officer) && (
              <div className="mt-2.5 space-y-1 text-xs text-text-secondary">
                {item.location && (
                  <p>
                    <span className="font-semibold text-text-primary">Lokasi:</span>{' '}
                    {item.location}
                  </p>
                )}
                {item.officer && (
                  <p>
                    <span className="font-semibold text-text-primary">Petugas:</span>{' '}
                    {item.officer}
                  </p>
                )}
                {item.description && (
                  <p className="pt-1 text-text-primary">{item.description}</p>
                )}
              </div>
            )}

            {item.actions && <div className="mt-3 pt-2">{item.actions}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

