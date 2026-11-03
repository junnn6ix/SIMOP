import * as React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import { db } from '@/db';
import { user as userTable } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session || !sessionData.user) {
    redirect('/login');
  }

  const [dbUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sessionData.user.id))
    .limit(1);

  if (!dbUser || !dbUser.aktif || dbUser.banned) {
    redirect('/login');
  }

  return (
    <AppShell
      user={{
        name: dbUser.name,
        username: dbUser.username || '',
        role: dbUser.role,
        bidang: dbUser.bidang,
      }}
    >
      {children}
    </AppShell>
  );
}
