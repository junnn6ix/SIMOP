import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { cn } from '@/lib/cn';

export interface InfoItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface InfoCardProps {
  title: string;
  description?: string;
  items: InfoItem[];
  actions?: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function InfoCard({
  title,
  description,
  items,
  actions,
  columns = 2,
  className,
}: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </CardHeader>
      <CardContent className="pt-6">
        <dl
          className={cn(
            'grid gap-y-4 gap-x-6',
            columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
          )}
        >
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <dt className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                {item.icon && <span className="opacity-70">{item.icon}</span>}
                <span>{item.label}</span>
              </dt>
              <dd className="text-sm font-medium text-text-primary">
                {item.value || '-'}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

