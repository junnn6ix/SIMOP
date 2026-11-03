'use server';

import { headers } from 'next/headers';
import { requireAuth } from '@/lib/session';
import { auth } from '@/lib/auth';
import { changePasswordSchema, ChangePasswordInput } from './schema';

export async function changePasswordAction(input: ChangePasswordInput) {
  const session = await requireAuth({ checkDbActive: true });

  if (!session.user || !session.user.aktif) {
    throw new Error('Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.');
  }

  const parsed = changePasswordSchema.parse(input);
  const reqHeaders = await headers();

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
        revokeOtherSessions: true,
      },
      headers: reqHeaders,
    });

    return {
      success: true,
      message: 'Password berhasil diperbarui. Sesi pada perangkat lain telah dicabut demi keamanan.',
    };
  } catch (error: any) {
    const errorMsg =
      error?.body?.message ||
      error?.message ||
      'Gagal mengubah password. Pastikan password saat ini yang Anda masukkan benar.';

    throw new Error(errorMsg);
  }
}
