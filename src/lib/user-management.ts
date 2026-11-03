import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db';
import { user, session } from '@/db/schema/auth';

export interface DeactivateUserResult {
  success: boolean;
  message: string;
}

/**
 * Menonaktifkan akun pengguna secara atomik dalam transaksi database.
 *
 * PENTING:
 * Fungsi ini mengasumsikan pemanggil telah melewati guard otorisasi `requireRole(['ADMIN'])`.
 *
 * Aturan Proteksi:
 * 1. Tidak boleh menonaktifkan akun diri sendiri (targetUserId === currentUserId).
 * 2. Tidak boleh menonaktifkan satu-satunya akun Administrator yang masih aktif.
 * 3. Status di-set menjadi `aktif = false` dan `banned = true`.
 * 4. Seluruh sesi aktif pengguna dihapus seketika dari tabel `sessions`.
 */
export async function deactivateUser(
  targetUserId: string,
  currentUserId: string,
  reason: string = 'Akun dinonaktifkan oleh administrator dinas'
): Promise<DeactivateUserResult> {
  if (targetUserId === currentUserId) {
    throw new Error('Anda tidak dapat menonaktifkan akun Anda sendiri.');
  }

  return await db.transaction(async (tx) => {
    // 1. Ambil data target user
    const [target] = await tx
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (!target) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (!target.aktif) {
      return {
        success: true,
        message: `Akun @${target.username} sudah dalam kondisi nonaktif.`,
      };
    }

    // 2. Jika target adalah ADMIN, pastikan bukan admin aktif terakhir
    if (target.role === 'ADMIN') {
      const [adminCountResult] = await tx
        .select({ total: count() })
        .from(user)
        .where(and(eq(user.role, 'ADMIN'), eq(user.aktif, true)));

      if (Number(adminCountResult?.total || 0) <= 1) {
        throw new Error('Tidak dapat menonaktifkan akun administrator aktif terakhir di sistem.');
      }
    }

    // 3. Update status akun pengguna
    await tx
      .update(user)
      .set({
        aktif: false,
        banned: true,
        banReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUserId));

    // 4. Cabut seluruh sesi aktif yang dimiliki pengguna
    await tx.delete(session).where(eq(session.userId, targetUserId));

    return {
      success: true,
      message: `Akun @${target.username} berhasil dinonaktifkan dan seluruh sesi aktif telah dicabut.`,
    };
  });
}

/**
 * Mengaktifkan kembali akun pengguna dalam transaksi database.
 */
export async function activateUser(targetUserId: string): Promise<DeactivateUserResult> {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(user)
      .set({
        aktif: true,
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUserId))
      .returning();

    if (!updated) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    return {
      success: true,
      message: `Akun @${updated.username} berhasil diaktifkan kembali.`,
    };
  });
}
