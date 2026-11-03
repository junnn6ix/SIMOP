'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsNavProps {
  tabs: TabItem[];
  defaultTab?: string;
  paramName?: string;
  className?: string;
}

export function TabsNav({
  tabs,
  defaultTab,
  paramName = 'tab',
  className,
}: TabsNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab =
    searchParams.get(paramName) || defaultTab || tabs[0]?.id;

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        'flex border-b border-border overflow-x-auto no-scrollbar gap-2',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap focus-ring rounded-t-btn',
              isActive
                ? 'text-primary font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            )}
            aria-selected={isActive}
            role="tab"
          >
            {tab.icon && (
              <span
                className={cn(
                  'h-4 w-4',
                  isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
                )}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-xs font-mono font-semibold',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-text-secondary'
                )}
              >
                {tab.count}
              </span>
            )}
            {/* Active bottom indicator bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

