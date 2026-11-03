import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  badge,
  description,
  trend,
  href,
  className,
}: StatCardProps) {
  const content = (
    <div className="p-5 flex flex-col justify-between h-full">
      {/* Top Row: Icon Container + Small Label on Left, Context Badge on Right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-btn bg-muted border border-border text-text-secondary">
              {icon}
            </div>
          )}
          <span className="text-xs font-medium text-text-secondary truncate">
            {label}
          </span>
        </div>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-mono font-medium bg-muted border border-border text-text-secondary shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* Middle/Bottom: Prominent Value & Descriptive Note */}
      <div className="mt-4 space-y-1">
        <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-primary leading-tight">
          {value}
        </div>

        {(description || trend) && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-0.5">
            {trend && (
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-success-dark font-semibold' : 'text-error font-semibold'
                )}
              >
                {trend.value}
              </span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card variant="interactive" className={cn('h-full', className)}>
          {content}
        </Card>
      </Link>
    );
  }

  return <Card className={cn('h-full', className)}>{content}</Card>;
}
