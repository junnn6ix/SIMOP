import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/cn';

export interface AlertCardProps {
  title: string;
  description: string;
  count: number;
  href: string;
  linkText?: string;
  tone?: 'warning' | 'error' | 'neutral' | 'success';
  className?: string;
}

export function AlertCard({
  title,
  description,
  count,
  href,
  linkText = 'Lihat Semua',
  tone = 'warning',
  className,
}: AlertCardProps) {
  const toneStyles = {
    warning: {
      badge: 'bg-warning-tint text-warning-dark border-warning/20',
      dot: 'bg-warning',
    },
    error: {
      badge: 'bg-error-tint text-error-dark border-error/20',
      dot: 'bg-error',
    },
    neutral: {
      badge: 'bg-neutral-tint text-neutral-dark border-border',
      dot: 'bg-text-secondary',
    },
    success: {
      badge: 'bg-success-tint text-success-dark border-success/20',
      dot: 'bg-success',
    },
  };

  const currentTone = toneStyles[tone];

  return (
    <Card
      variant="interactive"
      className={cn('p-5 flex flex-col justify-between', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', currentTone.dot)} />
            <h4 className="text-sm font-bold text-text-primary font-display">
              {title}
            </h4>
          </div>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold font-sans tabular-nums border',
            currentTone.badge
          )}
        >
          {count}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <Link
          href={href}
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline group"
        >
          <span>{linkText}</span>
          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}

