import * as React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import { db } from '@/db';
import { user as userTable } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionData = await getServerSession();
  if (!sessionData?.user) {
    redirect('/login');
  }

  const [dbUser] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, sessionData.user.id))
    .limit(1);

  if (dbUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

