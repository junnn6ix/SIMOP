'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { QuickActionDropdown } from '@/components/layout/QuickActionDropdown';
import { SidebarUserCard } from '@/components/layout/SidebarUserCard';
import { getNavGroupsForRole, UserRole } from '@/config/navigation';
import { cn } from '@/lib/cn';

export interface SidebarProps {
  user?: {
    name: string;
    username: string;
    role: UserRole;
    bidang?: string;
  } | null;
  collapsed: boolean;
  onSignOut?: () => void;
  className?: string;
}

export function Sidebar({
  user,
  collapsed,
  onSignOut,
  className,
}: SidebarProps) {
  const groups = getNavGroupsForRole(user?.role);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r border-border bg-surface text-text-primary transition-[width] duration-200 ease-in-out z-20 h-screen sticky top-0',
        collapsed ? 'w-[68px]' : 'w-64',
        className
      )}
      aria-label="Sidebar Utama"
    >
      {/* Brand Header */}
      <div className="h-[52px] border-b border-border flex items-center px-4 shrink-0">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 rounded-btn focus-ring group transition-opacity hover:opacity-90',
            collapsed ? 'mx-auto justify-center' : 'w-full'
          )}
          title="SIMOP DPMPTSP Karawang"
        >
          <div className="h-7 w-7 rounded-btn bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs tracking-tight text-text-primary leading-tight">
                SIMOP DPMPTSP
              </span>
              <span className="text-[10px] font-mono text-text-secondary leading-none uppercase tracking-wider truncate">
                Kabupaten Karawang
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Quick Action Trigger */}
      <div className={cn('px-3 pt-3 pb-1 shrink-0', collapsed && 'px-2')}>
        <QuickActionDropdown role={user?.role} collapsed={collapsed} />
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        <SidebarNav groups={groups} collapsed={collapsed} />
      </div>

      {/* User Footer Profile */}
      <SidebarUserCard
        user={user}
        collapsed={collapsed}
        onSignOut={onSignOut}
        className="shrink-0"
      />
    </aside>
  );
}

