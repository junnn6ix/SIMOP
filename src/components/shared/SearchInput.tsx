'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = 'Cari...',
  debounceMs = 300,
  className,
  autoFocus,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  React.useEffect(() => {
    if (!onChange || isControlled) return;
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, onChange, debounceMs, isControlled]);

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) {
      setInternalValue(val);
    } else {
      onChange?.(val);
    }
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 h-4 w-4 text-text-secondary pointer-events-none opacity-60" />
      <Input
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-9 pr-8 h-9 text-sm rounded-btn"
      />
      {currentValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 rounded-full p-0.5 text-text-secondary hover:text-text-primary hover:bg-muted focus-ring"
          aria-label="Bersihkan pencarian"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
