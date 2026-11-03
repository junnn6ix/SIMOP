import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { globalSearchAction } from '@/modules/search/actions';
import { requireAuth } from '@/lib/session';
import { db } from '@/db';

vi.mock('@/lib/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Fase 5: CommandMenu & Global Search (Role-based & Max 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when query is less than 2 characters', async () => {
    (requireAuth as any).mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
      },
    });

    const res1 = await globalSearchAction('');
    const res2 = await globalSearchAction('a');
    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('allows ADMIN to search employees, inventory, and PBG up to 8 items', async () => {
    (requireAuth as any).mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
      },
    });

    // 1. Mock select users
    const mockUsers = [
      { id: 'usr-1', name: 'Budi Santoso', username: 'budi_ptsp', bidang: 'PTSP', role: 'PEGAWAI' },
      { id: 'usr-2', name: 'Budi Darmawan', username: 'budi_pm', bidang: 'PM', role: 'PEGAWAI' },
    ];

    // 2. Mock select barang
    const mockBarang = [
      { id: 'brg-1', nama: 'Buku Agenda Dinas', kodeBarang: 'BRG-001', stok: 15, satuan: 'Pcs' },
    ];

    let selectCallCount = 0;
    (db.select as any).mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: () => {
            selectCallCount++;
            if (selectCallCount === 1) return Promise.resolve(mockUsers);
            if (selectCallCount === 2) return Promise.resolve(mockBarang);
            return Promise.resolve([]); // pbg empty
          },
        }),
      }),
    }));

    const results = await globalSearchAction('Budi');
    expect(results.length).toBe(3);

    // Results category checks
    expect(results[0].category).toBe('Pegawai');
    expect(results[0].title).toBe('Budi Santoso');
    expect(results[0].href).toBe('/admin/pegawai');

    expect(results[2].category).toBe('Inventaris & ATK');
    expect(results[2].title).toBe('Buku Agenda Dinas');
    expect(results[2].href).toBe('/admin/inventaris');
  });

  it('restricts PEGAWAI to search only their own schedules and catalog items', async () => {
    (requireAuth as any).mockResolvedValue({
      user: {
        id: 'pegawai-1',
        role: 'PEGAWAI',
      },
    });

    const mockOwnSchedules = [
      {
        id: 'jdw-1',
        judul: 'Pengawasan Lapangan Kawasan Suryacipta',
        status: 'BELUM_DIKERJAKAN',
        tanggal: '2026-11-04',
        lokasiTipe: 'KECAMATAN',
      },
    ];

    const mockCatalog = [
      { id: 'brg-2', nama: 'Spidol Whiteboard', kodeBarang: 'BRG-002', stok: 20, satuan: 'Pcs' },
    ];

    let selectCallCount = 0;
    (db.select as any).mockImplementation(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => {
              selectCallCount++;
              return Promise.resolve(mockOwnSchedules);
            },
          }),
          limit: () => {
            selectCallCount++;
            return Promise.resolve(mockCatalog);
          },
        }),
      }),
    }));

    const results = await globalSearchAction('Pengawasan');
    expect(results.length).toBe(2);

    expect(results[0].category).toBe('Jadwal Tugas');
    expect(results[0].title).toBe('Pengawasan Lapangan Kawasan Suryacipta');
    expect(results[0].href).toBe('/pegawai/jadwal');

    expect(results[1].category).toBe('Inventaris & ATK');
    expect(results[1].href).toBe('/pegawai/tiket');
  });

  it('strictly ensures PEGAWAI never receives results for other employees, PBG, or other users schedules', async () => {
    const callerId = 'pegawai-caller-99';
    (requireAuth as any).mockResolvedValue({
      user: {
        id: callerId,
        role: 'PEGAWAI',
      },
    });

    let queriesIssuedForTables: string[] = [];
    (db.select as any).mockImplementation(() => ({
      from: (tableObj: any) => {
        try {
          queriesIssuedForTables.push(getTableName(tableObj));
        } catch {
          queriesIssuedForTables.push('unknown');
        }
        return {
          where: (_clause: any) => ({
            orderBy: () => ({
              limit: () => Promise.resolve([]),
            }),
            limit: () => Promise.resolve([]),
          }),
        };
      },
    }));

    const results = await globalSearchAction('PT Karawang Abadi');

    // 1. None of the returned items should have category 'Pegawai' or 'Retribusi PBG'
    expect(results.some((r) => r.category === 'Pegawai')).toBe(false);
    expect(results.some((r) => r.category === 'Retribusi PBG')).toBe(false);

    // 2. The DB tables queried for PEGAWAI must ONLY be jadwal and barang (NEVER users or pbg)
    expect(queriesIssuedForTables).toContain('jadwal');
    expect(queriesIssuedForTables).toContain('barang');
    expect(queriesIssuedForTables).not.toContain('users');
    expect(queriesIssuedForTables).not.toContain('pbg');
  });
});
