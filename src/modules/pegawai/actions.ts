'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { requireRole } from '@/lib/session';
import { db } from '@/db';
import { user, account } from '@/db/schema/auth';
import { auth, getSyntheticEmail } from '@/lib/auth';
import { deactivateUser, activateUser } from '@/lib/user-management';
import {
  createPegawaiSchema,
  updatePegawaiSchema,
  resetPasswordSchema,
  CreatePegawaiInput,
  UpdatePegawaiInput,
  ResetPasswordInput,
} from './schema';

export async function createPegawaiAction(input: CreatePegawaiInput) {
  await requireRole(['ADMIN']);

  const parsed = createPegawaiSchema.parse(input);
  const email = getSyntheticEmail(parsed.username);

  // Periksa apakah username sudah terpakai
  const existing = await db.query.user.findFirst({
    where: (tbl, { eq }) => eq(tbl.username, parsed.username),
  });

  if (existing) {
    throw new Error(`Username @${parsed.username} sudah digunakan.`);
  }

  const userId = crypto.randomUUID();

  // Simpan record user
  await db.insert(user).values({
    id: userId,
    name: parsed.name,
    email,
    emailVerified: true,
    username: parsed.username,
    displayUsername: parsed.username,
    role: 'PEGAWAI',
    bidang: parsed.bidang,
    nip: parsed.nip || null,
    aktif: true,
    banned: false,
  });

  // Simpan record account dengan password ter-hash
  const hashedPassword = await hashPassword(parsed.password);
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId: userId,
    password: hashedPassword,
  });

  revalidatePath('/admin/pegawai');
  return { success: true, message: `Akun pegawai @${parsed.username} berhasil dibuat.` };
}

export async function updatePegawaiAction(input: UpdatePegawaiInput) {
  await requireRole(['ADMIN']);

  const parsed = updatePegawaiSchema.parse(input);

  await db
    .update(user)
    .set({
      name: parsed.name,
      bidang: parsed.bidang,
      nip: parsed.nip || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, parsed.id));

  revalidatePath('/admin/pegawai');
  return { success: true, message: 'Data pegawai berhasil diperbarui.' };
}

export async function resetPegawaiPasswordAction(input: ResetPasswordInput) {
  await requireRole(['ADMIN']);

  const parsed = resetPasswordSchema.parse(input);
  const hashedPassword = await hashPassword(parsed.newPassword);

  // Update password pada akun credential pengguna
  const result = await db
    .update(account)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(account.userId, parsed.userId));

  revalidatePath('/admin/pegawai');
  return { success: true, message: 'Kata sandi berhasil direset.' };
}

export async function togglePegawaiStatusAction(targetUserId: string, setAktif: boolean, reason?: string) {
  const { user: currentUser } = await requireRole(['ADMIN']);

  if (setAktif) {
    const res = await activateUser(targetUserId);
    revalidatePath('/admin/pegawai');
    return res;
  } else {
    const res = await deactivateUser(targetUserId, currentUser.id, reason);
    revalidatePath('/admin/pegawai');
    return res;
  }
}

