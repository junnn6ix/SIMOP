'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/config/navigation';
import { cn } from '@/lib/cn';

export interface NavLinksProps {
  items: NavItem[];
  onItemClick?: () => void;
  className?: string;
  isMobile?: boolean;
}

export function NavLinks({
  items,
  onItemClick,
  className,
  isMobile = false,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        isMobile
          ? 'flex flex-col space-y-1'
          : 'flex items-center space-x-1 lg:space-x-2',
        className
      )}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center rounded-btn px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-muted text-primary font-semibold'
                : 'text-text-secondary hover:bg-muted hover:text-text-primary',
              isMobile && 'py-2.5 px-4 text-base'
            )}
          >
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

