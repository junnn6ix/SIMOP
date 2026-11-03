import * as React from 'react';
import { requireAuth } from '@/lib/session';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  return (
    <AppShell
      user={{
        name: user.name,
        username: user.username || '',
        role: user.role,
        bidang: user.bidang,
      }}
    >
      {children}
    </AppShell>
  );
}

