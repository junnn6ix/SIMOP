'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { QuickActionDropdown } from '@/components/layout/QuickActionDropdown';
import { SidebarUserCard } from '@/components/layout/SidebarUserCard';
import { getNavGroupsForRole, UserRole } from '@/config/navigation';

export interface MobileSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    name: string;
    username: string;
    role: UserRole;
    bidang?: string;
  } | null;
  onSignOut?: () => void;
}

export function MobileSidebarDrawer({
  open,
  onOpenChange,
  user,
  onSignOut,
}: MobileSidebarDrawerProps) {
  const groups = getNavGroupsForRole(user?.role);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="p-0 flex flex-col w-[280px] max-w-[85vw] border-r border-border bg-surface text-text-primary"
      >
        {/* Header with Branding */}
        <SheetHeader className="h-[52px] border-b border-border px-4 flex flex-row items-center justify-between space-y-0 shrink-0">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={handleClose}
              className="flex items-center gap-2.5 rounded-btn focus-ring"
            >
              <div className="h-7 w-7 rounded-btn bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs tracking-tight text-text-primary leading-tight">
                  SIMOP DPMPTSP
                </span>
                <span className="text-[10px] font-mono text-text-secondary leading-none uppercase tracking-wider">
                  Karawang
                </span>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Quick Action Button */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <QuickActionDropdown
            role={user?.role}
            collapsed={false}
            onSelectAction={handleClose}
          />
        </div>

        {/* Grouped Nav Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
          <SidebarNav
            groups={groups}
            collapsed={false}
            onItemClick={handleClose}
          />
        </div>

        {/* User Card */}
        <SidebarUserCard
          user={user}
          collapsed={false}
          onSignOut={() => {
            handleClose();
            onSignOut?.();
          }}
          className="shrink-0"
        />
      </SheetContent>
    </Sheet>
  );
}

