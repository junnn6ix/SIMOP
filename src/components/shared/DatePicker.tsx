'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  min?: string;
  max?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  error,
  disabled,
  className,
  id,
  name,
  placeholder = 'Pilih tanggal',
}: DatePickerProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Input
        type="date"
        id={id}
        name={name}
        value={value || ''}
        min={min}
        max={max}
        disabled={disabled}
        error={error}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-9 pr-3 text-sm font-sans"
      />
      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary opacity-60" />
    </div>
  );
}

