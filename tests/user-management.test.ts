import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deactivateUser, activateUser } from '@/lib/user-management';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

import { db } from '@/db';

describe('user-management service (Atomic Deactivation & Protections)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects deactivating own account (targetUserId === currentUserId)', async () => {
    await expect(deactivateUser('admin-1', 'admin-1')).rejects.toThrow(
      'Anda tidak dapat menonaktifkan akun Anda sendiri.'
    );
  });

  it('rejects deactivating the last active administrator', async () => {
    const mockTx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValueOnce([
              {
                id: 'admin-1',
                username: 'admin',
                role: 'ADMIN',
                aktif: true,
              },
            ]),
          })),
        })),
      })),
    };

    // Second select for count
    mockTx.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                { id: 'admin-1', username: 'admin', role: 'ADMIN', aktif: true },
              ]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([{ total: 1 }]),
        }),
      });

    vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
      return cb(mockTx);
    });

    await expect(deactivateUser('admin-1', 'admin-2')).rejects.toThrow(
      'Tidak dapat menonaktifkan akun administrator aktif terakhir di sistem.'
    );
  });

  it('successfully deactivates active pegawai and deletes sessions inside transaction', async () => {
    const mockTx = {
      select: vi.fn().mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                { id: 'pegawai-1', username: 'budi', role: 'PEGAWAI', aktif: true },
              ]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValueOnce({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
      delete: vi.fn().mockReturnValueOnce({
        where: () => Promise.resolve({ rowCount: 1 }),
      }),
    };

    vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
      return cb(mockTx);
    });

    const result = await deactivateUser('pegawai-1', 'admin-1', 'Resign');
    expect(result.success).toBe(true);
    expect(result.message).toContain('berhasil dinonaktifkan');
    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.delete).toHaveBeenCalled();
  });

  it('successfully activates an inactive user inside transaction', async () => {
    const mockTx = {
      update: vi.fn().mockReturnValueOnce({
        set: () => ({
          where: () => ({
            returning: () =>
              Promise.resolve([{ id: 'pegawai-1', username: 'budi', aktif: true }]),
          }),
        }),
      }),
    };

    vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
      return cb(mockTx);
    });

    const result = await activateUser('pegawai-1');
    expect(result.success).toBe(true);
    expect(result.message).toContain('berhasil diaktifkan');
    expect(mockTx.update).toHaveBeenCalled();
  });
});
