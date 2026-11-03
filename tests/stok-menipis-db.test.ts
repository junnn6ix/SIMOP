import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, isNull, lte, inArray, count } from 'drizzle-orm';
import { createTestDb } from '@/db';
import { barang } from '@/db/schema/domain';

describe('Real PostgreSQL Integration Test: Stok Menipis SQL Query (stok <= limit_stok & non-archived)', () => {
  let testDb: ReturnType<typeof createTestDb>['testDb'];
  let testPool: ReturnType<typeof createTestDb>['testPool'];

  const itemA = `test-brg-a-${crypto.randomUUID().slice(0, 8)}`;
  const itemB = `test-brg-b-${crypto.randomUUID().slice(0, 8)}`;
  const itemC = `test-brg-c-${crypto.randomUUID().slice(0, 8)}`;
  const itemD = `test-brg-d-${crypto.randomUUID().slice(0, 8)}`;
  const createdIds = [itemA, itemB, itemC, itemD];

  beforeAll(async () => {
    const conn = createTestDb();
    testDb = conn.testDb;
    testPool = conn.testPool;

    // Bersihkan data sisa jika ada
    await testDb.delete(barang).where(inArray(barang.id, createdIds));

    // 1. Item A: stok=3, limit_stok=5, non-archived -> MASUK (stok <= limit_stok)
    await testDb.insert(barang).values({
      id: itemA,
      nama: 'Barang A (Menipis Default)',
      kodeBarang: `BRG-A-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      kategori: 'ATK',
      stok: 3,
      limitStok: 5,
      satuan: 'Rim',
      diarsipkanPada: null,
    });

    // 2. Item B: stok=10, limit_stok=5, non-archived -> TIDAK MASUK (stok aman)
    await testDb.insert(barang).values({
      id: itemB,
      nama: 'Barang B (Aman)',
      kodeBarang: `BRG-B-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      kategori: 'ATK',
      stok: 10,
      limitStok: 5,
      satuan: 'Box',
      diarsipkanPada: null,
    });

    // 3. Item C: stok=8, limit_stok=10, non-archived -> MASUK (limit kustom dinamis: 8 <= 10)
    await testDb.insert(barang).values({
      id: itemC,
      nama: 'Barang C (Menipis Kustom)',
      kodeBarang: `BRG-C-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      kategori: 'ASET',
      stok: 8,
      limitStok: 10,
      satuan: 'Unit',
      diarsipkanPada: null,
    });

    // 4. Item D: stok=1, limit_stok=5, diarsipkan -> TIDAK MASUK (dikecualikan karena diarsipkan)
    await testDb.insert(barang).values({
      id: itemD,
      nama: 'Barang D (Diarsipkan)',
      kodeBarang: `BRG-D-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      kategori: 'ATK',
      stok: 1,
      limitStok: 5,
      satuan: 'Pcs',
      diarsipkanPada: new Date(),
    });
  });

  afterAll(async () => {
    try {
      await testDb.delete(barang).where(inArray(barang.id, createdIds));
    } finally {
      await testPool.end();
    }
  });

  it('correctly filters low-stock items in SQL using column comparison (stok <= limit_stok) and excluding archived', async () => {
    const results = await testDb
      .select({
        id: barang.id,
        nama: barang.nama,
        stok: barang.stok,
        limitStok: barang.limitStok,
      })
      .from(barang)
      .where(
        and(
          inArray(barang.id, createdIds),
          isNull(barang.diarsipkanPada),
          lte(barang.stok, barang.limitStok)
        )
      );

    const resultIds = results.map((r) => r.id);
    expect(resultIds).toContain(itemA);
    expect(resultIds).toContain(itemC);
    expect(resultIds).not.toContain(itemB);
    expect(resultIds).not.toContain(itemD);
    expect(results.length).toBe(2);

    // Verifikasi agregat count() SQL
    const [countRow] = await testDb
      .select({ total: count() })
      .from(barang)
      .where(
        and(
          inArray(barang.id, createdIds),
          isNull(barang.diarsipkanPada),
          lte(barang.stok, barang.limitStok)
        )
      );

    expect(Number(countRow?.total)).toBe(2);
  });
});

