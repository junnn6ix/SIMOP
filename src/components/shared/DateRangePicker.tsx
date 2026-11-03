'use client';

import * as React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onRangeChange?: (range: { startDate: string; endDate: string }) => void;
  minDate?: string;
  maxDate?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate = '',
  endDate = '',
  onRangeChange,
  minDate,
  maxDate,
  error,
  disabled,
  className,
}: DateRangePickerProps) {
  const [internalStart, setInternalStart] = React.useState(startDate);
  const [internalEnd, setInternalEnd] = React.useState(endDate);

  const start = startDate !== undefined ? startDate : internalStart;
  const end = endDate !== undefined ? endDate : internalEnd;

  const handleStartChange = (val: string) => {
    setInternalStart(val);
    onRangeChange?.({ startDate: val, endDate: end });
  };

  const handleEndChange = (val: string) => {
    setInternalEnd(val);
    onRangeChange?.({ startDate: start, endDate: val });
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center gap-2 w-full',
        className
      )}
    >
      <div className="relative w-full">
        <Input
          type="date"
          value={start}
          min={minDate}
          max={end || maxDate}
          error={error}
          disabled={disabled}
          onChange={(e) => handleStartChange(e.target.value)}
          aria-label="Tanggal Mulai"
          className="pl-9 text-xs"
        />
        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary opacity-60" />
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-text-neutral hidden sm:block" />

      <div className="relative w-full">
        <Input
          type="date"
          value={end}
          min={start || minDate}
          max={maxDate}
          error={error}
          disabled={disabled}
          onChange={(e) => handleEndChange(e.target.value)}
          aria-label="Tanggal Selesai"
          className="pl-9 text-xs"
        />
        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary opacity-60" />
      </div>
    </div>
  );
}
