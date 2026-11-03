import { cn } from '@/lib/cn';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-btn bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };

