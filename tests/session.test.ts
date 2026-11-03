import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '@/lib/session';

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/db';

describe('requireRole session guard', () => {
  it('throws an error if no active session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);

    await expect(requireRole(['ADMIN'])).rejects.toThrow(
      'Sesi Anda telah berakhir atau belum masuk. Silakan login kembali.'
    );
  });

  it('rejects access if user is inactive (aktif = false) in database', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      session: { id: 's1', userId: 'u1' },
      user: { id: 'u1', role: 'ADMIN', aktif: true },
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'u1',
                role: 'ADMIN',
                aktif: false, // Inactive in DB
                banned: false,
              },
            ]),
        }),
      }),
    } as any);

    await expect(requireRole(['ADMIN'], { checkDbActive: true })).rejects.toThrow(
      'Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.'
    );
  });

  it('rejects access if user role does not match allowed roles', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      session: { id: 's1', userId: 'u1' },
      user: { id: 'u1', role: 'PEGAWAI', aktif: true },
    } as any);

    vi.mocked(db.select).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'u1',
                role: 'PEGAWAI',
                aktif: true,
                banned: false,
              },
            ]),
        }),
      }),
    } as any);

    await expect(requireRole(['ADMIN'], { checkDbActive: true })).rejects.toThrow(
      'Anda tidak memiliki hak akses untuk halaman atau tindakan ini.'
    );
  });

  it('returns context successfully when user is active and role matches', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      session: { id: 's1', userId: 'u1' },
      user: { id: 'u1', role: 'ADMIN', aktif: true },
    } as any);

    const mockDbUser = {
      id: 'u1',
      name: 'Admin User',
      role: 'ADMIN',
      aktif: true,
      banned: false,
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([mockDbUser]),
        }),
      }),
    } as any);

    const result = await requireRole(['ADMIN'], { checkDbActive: true });
    expect(result.user.id).toBe('u1');
    expect(result.user.role).toBe('ADMIN');
    expect(result.session.id).toBe('s1');
  });
});

