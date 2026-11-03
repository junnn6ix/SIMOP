import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
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
  description,
  trend,
  href,
  className,
}: StatCardProps) {
  const content = (
    <div className="p-6 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {label}
        </span>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-primary">
          {value}
        </div>

        {(description || trend) && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-1">
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
            {description && <span>{description}</span>}
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

