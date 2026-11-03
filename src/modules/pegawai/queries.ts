import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema/auth';

export async function getPegawaiList() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      bidang: user.bidang,
      nip: user.nip,
      aktif: user.aktif,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return users;
}

