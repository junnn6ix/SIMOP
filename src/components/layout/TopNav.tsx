'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { NavItem } from '@/config/navigation';
import { NavLinks } from '@/components/layout/NavLinks';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';

export interface TopNavProps {
  items: NavItem[];
  user?: {
    name: string;
    username: string;
    role: string;
    bidang?: string;
  } | null;
  onOpenCommand?: () => void;
  onSignOut?: () => void;
}

export function TopNav({
  items,
  user,
  onOpenCommand,
  onSignOut,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-container items-center justify-between px-6">
        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          <MobileNavDrawer items={items} />
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-display font-bold text-text-primary tracking-tight transition-opacity hover:opacity-90"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-btn bg-primary text-primary-foreground text-sm font-bold shadow-sm">
              S
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">SIMOP</span>
              <span className="text-[10px] text-text-secondary font-sans font-normal leading-none hidden sm:inline-block">
                DPMPTSP Karawang
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop NavLinks */}
        <div className="hidden md:flex md:items-center">
          <NavLinks items={items} />
        </div>

        {/* Right: Search / Command trigger + UserMenu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenCommand && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenCommand}
              className="h-8 px-2.5 sm:px-3 text-xs text-text-secondary hover:text-text-primary"
              aria-label="Cari Cepat (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Cari...</span>
              <kbd className="hidden lg:inline-flex ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-text-neutral">
                ⌘K
              </kbd>
            </Button>
          )}

          {user && <UserMenu user={user} onSignOut={onSignOut} />}
        </div>
      </div>
    </header>
  );
}

