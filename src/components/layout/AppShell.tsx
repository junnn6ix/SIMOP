'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { TopNav } from '@/components/layout/TopNav';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { getNavigationForRole, UserRole } from '@/config/navigation';
import { signOut } from '@/lib/auth-client';

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
  const [commandOpen, setCommandOpen] = React.useState(false);
  const items = getNavigationForRole(user?.role || 'PEGAWAI');

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
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav
        items={items}
        user={user}
        onOpenCommand={() => setCommandOpen(true)}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 flex flex-col">{children}</main>
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        role={user?.role}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-border bg-surface text-text-primary rounded-panel shadow-lg text-sm font-sans',
        }}
      />
    </div>
  );
}

