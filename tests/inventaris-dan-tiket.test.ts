import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBarangSchema, adjustStokSchema } from '@/modules/inventaris/schema';
import { createTiketSchema, updateTiketStatusSchema } from '@/modules/tiket/schema';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'pegawai-1', name: 'Budi Pegawai', role: 'PEGAWAI', bidang: 'PTSP' },
  }),
  requireRole: vi.fn().mockResolvedValue({
    user: { id: 'admin-1', name: 'Super Admin', role: 'ADMIN' },
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { db } from '@/db';
import { accTiketAction, updateTiketStatusAction } from '@/modules/tiket/actions';
import { adjustStokAction, deleteOrArchiveBarangAction } from '@/modules/inventaris/actions';

describe('Fase 3: Inventaris & Tiket Layanan - Schema Validations', () => {
  it('validates createBarangSchema correctly with sensible defaults', () => {
    const valid = createBarangSchema.parse({
      nama: 'Kertas HVS A4 80gr',
      kategori: 'ATK',
      stok: 10,
    });
    expect(valid.nama).toBe('Kertas HVS A4 80gr');
    expect(valid.satuan).toBe('Pcs');
    expect(valid.stok).toBe(10);

    // Negative stock should fail
    expect(() =>
      createBarangSchema.parse({
        nama: 'Kertas',
        kategori: 'ATK',
        stok: -5,
      })
    ).toThrow();
  });

  it('validates adjustStokSchema preventing zero or negative adjustment values', () => {
    expect(() =>
      adjustStokSchema.parse({
        barangId: 'brg-1',
        tipe: 'MASUK',
        jumlah: 0,
        keterangan: 'Penerimaan',
      })
    ).toThrow('Jumlah mutasi stok minimal 1');

    const valid = adjustStokSchema.parse({
      barangId: 'brg-1',
      tipe: 'MASUK',
      jumlah: 5,
      keterangan: 'Penerimaan pengadaan baru',
    });
    expect(valid.jumlah).toBe(5);
  });

  it('validates createTiketSchema strictly allowing only PERMINTAAN_BARANG and LAPOR_KERUSAKAN', () => {
    const valid = createTiketSchema.parse({
      barangId: 'brg-1',
      jenis: 'PERMINTAAN_BARANG',
      jumlah: 2,
      keperluan: 'Kebutuhan cetak formulir perizinan pemohon',
    });
    expect(valid.jenis).toBe('PERMINTAAN_BARANG');

    // Invalid ticket type must fail
    expect(() =>
      createTiketSchema.parse({
        barangId: 'brg-1',
        jenis: 'PEMINJAMAN_ASET' as any,
        jumlah: 1,
        keperluan: 'Pinjam laptop untuk dinas luar',
      })
    ).toThrow('Pilih jenis layanan tiket yang valid');
  });
});

describe('Fase 3: Tiket Layanan - Atomic Stock Deduction & ACC Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes atomic stock deduction when ACC a PERMINTAAN_BARANG ticket', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // 1. Step 1: Update tiket claim status MENUNGGU -> ACC returning claimed row
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () =>
            Promise.resolve([
              {
                id: 'tiket-1',
                nomorTiket: 'TKT-20261103-0001',
                barangId: 'brg-1',
                jenis: 'PERMINTAAN_BARANG',
                jumlah: 3,
              },
            ]),
        }),
      }),
    });

    // 2. Step 2: Update barang returning 1 row (stok baru = 7)
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([{ id: 'brg-1', stok: 7 }]),
        }),
      }),
    });

    // 3. Step 3: Insert stok_log
    mockTx.insert.mockReturnValueOnce({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const result = await accTiketAction({
      tiketId: 'tiket-1',
      catatanAdmin: 'Disetujui, ambil di ruang umum',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('TKT-20261103-0001');
    expect(mockTx.insert).toHaveBeenCalledTimes(1);
    expect(mockTx.update).toHaveBeenCalledTimes(2);
  });

  it('fails and rolls back transaction when stock is insufficient for PERMINTAAN_BARANG', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // Step 1: Claim tiket success
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () =>
            Promise.resolve([
              {
                id: 'tiket-1',
                nomorTiket: 'TKT-20261103-0002',
                barangId: 'brg-1',
                jenis: 'PERMINTAAN_BARANG',
                jumlah: 5,
              },
            ]),
        }),
      }),
    });

    // Step 2: Update query with `WHERE stok >= 5` returns 0 rows (rejected)
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    });

    await expect(
      accTiketAction({
        tiketId: 'tiket-1',
      })
    ).rejects.toThrow('Stok barang tidak mencukupi untuk memenuhi permintaan tiket #TKT-20261103-0002');

    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it('allows ACC for PERMINTAAN_BARANG without barangId without stock deduction and without stok_log', async () => {
    const mockTx = {
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // Step 1: Claim tiket PERMINTAAN_BARANG tanpa barangId
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () =>
            Promise.resolve([
              {
                id: 'tiket-nobrg',
                nomorTiket: 'TKT-20261103-0003',
                barangId: null,
                jenis: 'PERMINTAAN_BARANG',
                jumlah: 1,
              },
            ]),
        }),
      }),
    });

    const result = await accTiketAction({
      tiketId: 'tiket-nobrg',
      catatanAdmin: 'Disetujui barang khusus luar katalog',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('TKT-20261103-0003');
    // Update hanya dipanggil 1 kali untuk klaim tiket, tidak ada update barang
    expect(mockTx.update).toHaveBeenCalledTimes(1);
    // Tidak ada stok_log yang dimasukkan
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it('rejects double ACC: only tickets with status MENUNGGU can be approved', async () => {
    const mockTx = {
      update: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // Step 1: Claim update returns 0 rows (already ACC or not MENUNGGU)
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    });

    await expect(
      accTiketAction({
        tiketId: 'tiket-1',
      })
    ).rejects.toThrow('tidak ditemukan atau sudah tidak berstatus MENUNGGU');
  });

  it('does not cut stock when ACC a LAPOR_KERUSAKAN ticket', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // Step 1: Claim tiket LAPOR_KERUSAKAN
    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () =>
            Promise.resolve([
              {
                id: 'tiket-damage',
                nomorTiket: 'TKT-20261103-0004',
                barangId: 'asset-1',
                jenis: 'LAPOR_KERUSAKAN',
                jumlah: 1,
              },
            ]),
        }),
      }),
    });

    const result = await accTiketAction({
      tiketId: 'tiket-damage',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('TKT-20261103-0004');
    expect(mockTx.insert).not.toHaveBeenCalled();
    expect(mockTx.select).not.toHaveBeenCalled();
    expect(mockTx.update).toHaveBeenCalledTimes(1);
  });
});

describe('Fase 3: Inventaris - Stock Adjustment & Non-Negative Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks stock adjustment KELUAR if reduction exceeds available stock', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // Target barang has stock 3
    mockTx.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'brg-1',
                nama: 'Stapler Besar',
                stok: 3,
              },
            ]),
        }),
      }),
    });

    // Attempting to adjust KELUAR 5 units
    await expect(
      adjustStokAction({
        barangId: 'brg-1',
        tipe: 'KELUAR',
        jumlah: 5,
        keterangan: 'Distribusi massal',
      })
    ).rejects.toThrow('Stok saat ini (3) tidak mencukupi untuk pengurangan sebanyak 5');

    expect(mockTx.update).not.toHaveBeenCalled();
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it('allows valid stock adjustment MASUK and logs mutation', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    mockTx.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'brg-1',
                nama: 'Spidol Whiteboard',
                stok: 10,
              },
            ]),
        }),
      }),
    });

    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => Promise.resolve(undefined),
      }),
    });

    mockTx.insert.mockReturnValueOnce({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const res = await adjustStokAction({
      barangId: 'brg-1',
      tipe: 'MASUK',
      jumlah: 20,
      keterangan: 'Pengadaan bulanan Bagian Umum',
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('10 ➔ 30');
    expect(mockTx.update).toHaveBeenCalledTimes(1);
    expect(mockTx.insert).toHaveBeenCalledTimes(1);
  });
});

describe('Fase 3: Inventaris - Delete vs Archive Rule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('archives barang (sets diarsipkanPada) when barang has existing ticket or stock log history', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // 1. Select barang exists
    mockTx.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                { id: 'brg-hist', nama: 'Laptop Lenovo ThinkPad' },
              ]),
          }),
        }),
      })
      // 2. Select tiket: exists!
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: 'tkt-existing' }]),
          }),
        }),
      })
      // 3. Select stokLog: exists!
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: 'log-existing' }]),
          }),
        }),
      });

    mockTx.update.mockReturnValueOnce({
      set: () => ({
        where: () => Promise.resolve(undefined),
      }),
    });

    const res = await deleteOrArchiveBarangAction('brg-hist');

    expect(res.success).toBe(true);
    expect(res.archived).toBe(true);
    expect(res.message).toContain('berhasil diarsipkan');
    expect(mockTx.update).toHaveBeenCalledTimes(1);
    expect(mockTx.delete).not.toHaveBeenCalled();
  });

  it('permanently deletes barang when barang has NO history (no tickets and no stock logs)', async () => {
    const mockTx = {
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    // 1. Select barang exists
    mockTx.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                { id: 'brg-clean', nama: 'Salah Input Barang' },
              ]),
          }),
        }),
      })
      // 2. Select tiket: empty
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      })
      // 3. Select stokLog: empty
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

    mockTx.delete.mockReturnValueOnce({
      where: () => Promise.resolve(undefined),
    });

    const res = await deleteOrArchiveBarangAction('brg-clean');

    expect(res.success).toBe(true);
    expect(res.archived).toBe(false);
    expect(res.message).toContain('berhasil dihapus secara permanen');
    expect(mockTx.delete).toHaveBeenCalledTimes(1);
    expect(mockTx.update).not.toHaveBeenCalled();
  });
});
