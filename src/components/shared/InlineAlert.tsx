import * as React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InlineAlertProps {
  title?: string;
  description: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  action?: React.ReactNode;
  className?: string;
}

export function InlineAlert({
  title,
  description,
  variant = 'info',
  action,
  className,
}: InlineAlertProps) {
  const variantStyles = {
    info: {
      container: 'border-border bg-muted/60 text-text-primary',
      icon: <Info className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />,
    },
    success: {
      container: 'border-success/30 bg-success-tint text-success-dark',
      icon: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />,
    },
    warning: {
      container: 'border-warning/30 bg-warning-tint text-warning-dark',
      icon: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />,
    },
    error: {
      container: 'border-error/30 bg-error-tint text-error-dark',
      icon: <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />,
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start justify-between gap-3 p-3.5 rounded-panel border text-xs sm:text-sm',
        current.container,
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {current.icon}
        <div className="space-y-0.5">
          {title && <p className="font-semibold">{title}</p>}
          <p className="opacity-90">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

