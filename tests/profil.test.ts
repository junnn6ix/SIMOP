import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changePasswordSchema } from '@/modules/profil/schema';

vi.mock('@/lib/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      changePassword: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ cookie: 'mock-session-token' })),
}));

import { requireAuth } from '@/lib/session';
import { auth } from '@/lib/auth';
import { changePasswordAction } from '@/modules/profil/actions';

describe('Fase 5: changePasswordAction & Profil Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. changePasswordSchema validates password length and confirmation match', () => {
    // Valid input
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      })
    ).not.toThrow();

    // Password too short (< 8 chars)
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'OldPassword123!',
        newPassword: 'short',
        confirmPassword: 'short',
      })
    ).toThrow();

    // Mismatched confirmation
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      })
    ).toThrow();
  });

  it('2. successfully changes password for active user session with revokeOtherSessions: true', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      session: { id: 'sess-1', userId: 'user-active-1' } as any,
      user: {
        id: 'user-active-1',
        name: 'Pegawai Aktif',
        role: 'PEGAWAI',
        aktif: true,
      } as any,
    });

    vi.mocked(auth.api.changePassword).mockResolvedValueOnce({} as any);

    const result = await changePasswordAction({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    });

    expect(result.success).toBe(true);
    expect(auth.api.changePassword).toHaveBeenCalledTimes(1);
    expect(auth.api.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewSecurePassword123!',
          revokeOtherSessions: true,
        },
      })
    );
  });

  it('3. strictly rejects password change when caller account is nonaktif (aktif = false)', async () => {
    // Simulasi user yang sesi masih ada namun status di database sudah dinonaktifkan
    vi.mocked(requireAuth).mockResolvedValueOnce({
      session: { id: 'sess-2', userId: 'user-inactive-2' } as any,
      user: {
        id: 'user-inactive-2',
        name: 'Pegawai Nonaktif',
        role: 'PEGAWAI',
        aktif: false,
      } as any,
    });

    await expect(
      changePasswordAction({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      })
    ).rejects.toThrow('Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.');

    expect(auth.api.changePassword).not.toHaveBeenCalled();
  });

  it('4. strictly rejects password change if requireAuth fails (unauthenticated or db check rejects)', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(
      new Error('Sesi Anda telah berakhir atau belum masuk. Silakan login kembali.')
    );

    await expect(
      changePasswordAction({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      })
    ).rejects.toThrow('Sesi Anda telah berakhir atau belum masuk');

    expect(auth.api.changePassword).not.toHaveBeenCalled();
  });
});

