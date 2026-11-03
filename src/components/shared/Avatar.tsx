import * as React from 'react';
import { cn } from '@/lib/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg font-bold',
};

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-primary font-semibold border border-primary/20',
        sizeClasses[size],
        className
      )}
      title={name}
      aria-label={`Avatar untuk ${name}`}
      {...props}
    >
      <span>{initials}</span>
    </div>
  );
}

