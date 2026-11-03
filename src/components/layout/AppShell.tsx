'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { MobileSidebarDrawer } from '@/components/layout/MobileSidebarDrawer';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { UserRole } from '@/config/navigation';
import { signOut } from '@/lib/auth-client';

const sidebarListeners = new Set<() => void>();

function subscribeSidebar(callback: () => void) {
  sidebarListeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    sidebarListeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function getSidebarSnapshot(): boolean {
  try {
    return localStorage.getItem('simop_sidebar_collapsed') === 'true';
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    username: string;
    role: UserRole;
    bidang?: string;
  } | null;
  onSignOut?: () => void;
}

export function AppShell({ children, user, onSignOut }: AppShellProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const collapsed = React.useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );

  const handleToggleCollapse = React.useCallback(() => {
    try {
      const current = localStorage.getItem('simop_sidebar_collapsed') === 'true';
      localStorage.setItem('simop_sidebar_collapsed', String(!current));
      sidebarListeners.forEach((listener) => listener());
    } catch {
      // ignore
    }
  }, []);

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    try {
      await signOut();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background flex text-text-primary w-full max-w-full overflow-x-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          user={user}
          collapsed={collapsed}
          onSignOut={handleSignOut}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          <TopHeader
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
            onOpenCommand={() => setCommandOpen(true)}
            user={user}
            onSignOut={handleSignOut}
          />
          <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">{children}</main>
        </div>

        {/* Mobile Drawer */}
        <MobileSidebarDrawer
          open={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Quick Search Palette */}
        <CommandMenu
          open={commandOpen}
          onOpenChange={setCommandOpen}
          role={user?.role}
        />

        {/* System Toaster */}
        <Toaster
          position="top-right"
          theme={resolvedTheme as 'light' | 'dark' | undefined}
          toastOptions={{
            className:
              'border border-border bg-surface text-text-primary rounded-panel shadow-lg text-sm font-sans',
          }}
        />
      </div>
      );
}
