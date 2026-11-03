import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth, User as AuthUser, Session as AuthSession } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema/auth';

export type UserRole = 'ADMIN' | 'PEGAWAI';

export interface RequireRoleOptions {
  /**
   * Jika bernilai true (default), verifikasi status aktif dan banned dilakukan
   * langsung ke database PostgreSQL, bukan hanya dari data sesi di cookie.
   */
  checkDbActive?: boolean;
}

export interface SessionContext {
  session: AuthSession;
  user: typeof user.$inferSelect;
}

/**
 * Mengambil sesi saat ini dari HTTP headers tanpa melempar exception jika belum login.
 */
export async function getServerSession() {
  const reqHeaders = await headers();
  return auth.api.getSession({
    headers: reqHeaders,
  });
}

/**
 * Memastikan request memiliki sesi valid, akun aktif di database, dan memiliki role yang diizinkan.
 * Melempar error ramah berbahasa Indonesia bila verifikasi gagal.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  options: RequireRoleOptions = { checkDbActive: true }
): Promise<SessionContext> {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session || !sessionData.user) {
    throw new Error('Sesi Anda telah berakhir atau belum masuk. Silakan login kembali.');
  }

  const { session, user: sessionUser } = sessionData;

  // Jika checkDbActive aktif (default true), query langsung ke database
  if (options.checkDbActive !== false) {
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, sessionUser.id))
      .limit(1);

    if (!dbUser) {
      throw new Error('Akun pengguna tidak ditemukan di database.');
    }

    if (!dbUser.aktif || dbUser.banned) {
      throw new Error(
        'Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.'
      );
    }

    if (!allowedRoles.includes(dbUser.role as UserRole)) {
      throw new Error('Anda tidak memiliki hak akses untuk halaman atau tindakan ini.');
    }

    return {
      session,
      user: dbUser,
    };
  }

  // Fallback membaca role & aktif dari session cookie bila checkDbActive secara eksplisit diset false
  const activeUser = sessionUser as unknown as typeof user.$inferSelect;
  if (!activeUser.aktif || activeUser.banned) {
    throw new Error(
      'Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.'
    );
  }

  if (!allowedRoles.includes(activeUser.role as UserRole)) {
    throw new Error('Anda tidak memiliki hak akses untuk halaman atau tindakan ini.');
  }

  return {
    session,
    user: activeUser,
  };
}

/**
 * Helper ringkas untuk mewajibkan autentikasi bagi semua role (ADMIN maupun PEGAWAI)
 */
export async function requireAuth(options?: RequireRoleOptions): Promise<SessionContext> {
  return requireRole(['ADMIN', 'PEGAWAI'], options);
}

