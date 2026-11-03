'use client';

import * as React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  description = 'Tidak dapat memuat data. Silakan coba beberapa saat lagi atau hubungi administrator.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card border border-error/30 bg-error-tint/20',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-tint text-error mb-4 border border-error/20">
        <AlertCircle className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h4 className="text-base font-bold font-display text-text-primary">
        {title}
      </h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-text-secondary">
        {description}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="border-error/40 text-error hover:bg-error-tint"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      )}
    </div>
  );
}

