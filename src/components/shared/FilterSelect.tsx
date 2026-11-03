'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  allOptionLabel?: string;
  className?: string;
  ariaLabel?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih filter',
  allOptionLabel = 'Semua',
  className,
  ariaLabel,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn('h-9 w-full sm:w-auto sm:min-w-[140px] text-xs', className)}
        aria-label={ariaLabel || placeholder}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allOptionLabel && (
          <SelectItem value="ALL">{allOptionLabel}</SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

