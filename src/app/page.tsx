import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sessionData = await getServerSession();

  if (!sessionData?.user) {
    redirect('/login');
  }

  redirect('/dashboard');
}
