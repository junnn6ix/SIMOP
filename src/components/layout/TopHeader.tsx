'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';
import { UserRole } from '@/config/navigation';
import { cn } from '@/lib/cn';

export interface TopHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobileDrawer: () => void;
  onOpenCommand: () => void;
  user?: {
    name: string;
    username: string;
    role: UserRole;
    bidang?: string;
  } | null;
  onSignOut?: () => void;
  className?: string;
}

const ROUTE_LABELS: Record<string, { section?: string; title: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/admin/jadwal': { section: 'Operasional', title: 'Jadwal Penugasan' },
  '/admin/verifikasi': { section: 'Operasional', title: 'Verifikasi Laporan' },
  '/admin/inventaris': { section: 'Layanan', title: 'Inventaris & ATK' },
  '/admin/pbg': { section: 'Layanan', title: 'Retribusi PBG' },
  '/admin/pegawai': { section: 'Administrasi', title: 'Manajemen Pegawai' },
  '/pegawai/jadwal': { section: 'Tugas', title: 'Jadwal Kedinasan' },
  '/pegawai/tiket': { section: 'Layanan', title: 'Tiket Saya' },
  '/pegawai/profil': { section: 'Akun', title: 'Profil Pegawai' },
};

function getBreadcrumb(pathname: string) {
  const match = ROUTE_LABELS[pathname];
  if (match) return match;

  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(`${route}/`)) {
      return label;
    }
  }

  return { title: 'SIMOP' };
}

export function TopHeader({
  collapsed,
  onToggleCollapse,
  onOpenMobileDrawer,
  onOpenCommand,
  user,
  onSignOut,
  className,
}: TopHeaderProps) {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-[52px] w-full border-b border-border bg-background/80 backdrop-blur select-none flex items-center justify-between px-4 sm:px-6 transition-colors',
        className
      )}
    >
      {/* Left: Toggles & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu button (touch target >= 40px) */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-10 w-10 p-0 rounded-btn text-text-secondary hover:text-text-primary"
          onClick={onOpenMobileDrawer}
          aria-label="Buka Navigasi Mobile"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:inline-flex h-8 w-8 p-0 rounded-btn text-text-secondary hover:text-text-primary"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <div className="h-4 w-px bg-border hidden sm:block" aria-hidden="true" />

        {/* Breadcrumb / Title */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-xs">
          {breadcrumb.section && (
            <>
              <span className="text-text-secondary hidden sm:inline truncate">
                {breadcrumb.section}
              </span>
              <span className="text-text-neutral hidden sm:inline" aria-hidden="true">
                /
              </span>
            </>
          )}
          <span className="font-semibold text-text-primary truncate">
            {breadcrumb.title}
          </span>
        </nav>
      </div>

      {/* Right: Quick Search, Theme Toggle, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenCommand}
          className="h-8 px-2.5 gap-2 text-text-secondary hover:text-text-primary border-border bg-surface/50 text-xs font-normal"
          aria-label="Pencarian cepat (⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-text-neutral" />
          <span className="hidden sm:inline text-xs">Cari...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.2 font-mono text-[10px] text-text-neutral">
            ⌘K
          </kbd>
        </Button>

        <ThemeToggle />

        {user && (
          <div className="pl-1">
            <UserMenu user={user} onSignOut={onSignOut} />
          </div>
        )}
      </div>
    </header>
  );
}
