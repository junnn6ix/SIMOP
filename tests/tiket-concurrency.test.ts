import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, sql } from 'drizzle-orm';
import { createTestDb } from '@/db';
import { barang, tiket, stokLog } from '@/db/schema/domain';
import { user, account } from '@/db/schema/auth';

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST ||
  'postgresql://neondb_owner:npg_E8kHS4pZMgol@ep-gentle-queen-azt739wp-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require';

describe('Real PostgreSQL Concurrency Test: Atomic Double-ACC Prevention & Single Stock Deduction', () => {
  let testDb: ReturnType<typeof createTestDb>['testDb'];
  let testPool: ReturnType<typeof createTestDb>['testPool'];

  const testUserId = `test-adm-${crypto.randomUUID().slice(0, 8)}`;
  const testBarangId = `test-brg-${crypto.randomUUID().slice(0, 8)}`;
  const testTiketId = `test-tkt-${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    const conn = createTestDb(TEST_DB_URL);
    testDb = conn.testDb;
    testPool = conn.testPool;

    // 1. Buat user dummy admin & pemohon
    await testDb.insert(user).values({
      id: testUserId,
      name: 'Admin Test Concurrency',
      email: `${testUserId}@simop.local`,
      username: testUserId,
      displayUsername: testUserId,
      role: 'ADMIN',
      bidang: 'SEKRETARIAT',
      aktif: true,
      banned: false,
    });

    // 2. Buat barang uji dengan stok awal = 10
    await testDb.insert(barang).values({
      id: testBarangId,
      nama: 'Barang Uji Konkurensi',
      kodeBarang: `BRG-CONC-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      kategori: 'ATK',
      stok: 10,
      satuan: 'Box',
    });

    // 3. Buat tiket permohonan sejumlah 4 unit
    await testDb.insert(tiket).values({
      id: testTiketId,
      nomorTiket: `TKT-CONC-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      pemohonId: testUserId,
      barangId: testBarangId,
      jenis: 'PERMINTAAN_BARANG',
      jumlah: 4,
      keperluan: 'Pengujian persaingan transaksi bersamaan (race condition)',
      status: 'MENUNGGU',
    });
  });

  afterAll(async () => {
    // Bersihkan data uji setelah selesai
    try {
      await testDb.delete(stokLog).where(eq(stokLog.barangId, testBarangId));
      await testDb.delete(tiket).where(eq(tiket.id, testTiketId));
      await testDb.delete(barang).where(eq(barang.id, testBarangId));
      await testDb.delete(account).where(eq(account.userId, testUserId));
      await testDb.delete(user).where(eq(user.id, testUserId));
    } finally {
      await testPool.end();
    }
  });

  it('guarantees that 2 concurrent ACC requests on the same ticket only deduct stock once', async () => {
    // Fungsi simulasi persis sama dengan implementasi accTiketAction
    async function executeAccTransaction() {
      return await testDb.transaction(async (tx) => {
        // Langkah 1: Klaim status ACC secara atomik
        const claimed = await tx
          .update(tiket)
          .set({
            status: 'ACC',
            catatanAdmin: 'Disetujui dalam uji konkurensi',
            updatedAt: new Date(),
          })
          .where(and(eq(tiket.id, testTiketId), eq(tiket.status, 'MENUNGGU')))
          .returning({
            id: tiket.id,
            nomorTiket: tiket.nomorTiket,
            barangId: tiket.barangId,
            jenis: tiket.jenis,
            jumlah: tiket.jumlah,
          });

        if (claimed.length === 0) {
          throw new Error(
            'Tiket tidak dapat disetujui: tiket tidak ditemukan atau sudah tidak berstatus MENUNGGU.'
          );
        }

        const targetTiket = claimed[0];

        // Langkah 2: Potong stok secara atomik langsung dengan RETURNING stok
        const updated = await tx
          .update(barang)
          .set({
            stok: sql`${barang.stok} - ${targetTiket.jumlah}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(barang.id, targetTiket.barangId!),
              sql`${barang.stok} >= ${targetTiket.jumlah}`
            )
          )
          .returning({ id: barang.id, stokSesudah: barang.stok });

        if (updated.length === 0) {
          throw new Error('Stok barang tidak mencukupi.');
        }

        const stokSesudah = updated[0].stokSesudah;
        const stokSebelum = stokSesudah + targetTiket.jumlah;

        // Langkah 3: Catat log mutasi
        await tx.insert(stokLog).values({
          id: crypto.randomUUID(),
          barangId: targetTiket.barangId!,
          tipe: 'KELUAR',
          jumlah: targetTiket.jumlah,
          stokSebelum,
          stokSesudah,
          keterangan: 'Persetujuan Tiket Concurrency Test',
          tiketId: targetTiket.id,
          userId: testUserId,
        });

        return { success: true, stokSesudah };
      });
    }

    // Eksekusi dua request ACC secara serentak (konkuren) via Promise.allSettled
    const [result1, result2] = await Promise.allSettled([
      executeAccTransaction(),
      executeAccTransaction(),
    ]);

    // Salah satu transaksi harus berhasil (fulfilled) dan satu harus gagal (rejected)
    const fulfilledCount = [result1, result2].filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = [result1, result2].filter((r) => r.status === 'rejected').length;

    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);

    const rejectedResult = (result1.status === 'rejected' ? result1 : result2) as PromiseRejectedResult;
    expect(rejectedResult.reason.message).toContain('sudah tidak berstatus MENUNGGU');

    // Verifikasi kondisi akhir basis data nyata PostgreSQL:
    // 1. Stok barang harus persis 6 (10 - 4), TIDAK boleh terpotong 2 kali menjadi 2 (10 - 8)
    const [finalBarang] = await testDb
      .select({ stok: barang.stok })
      .from(barang)
      .where(eq(barang.id, testBarangId));

    expect(finalBarang.stok).toBe(6);

    // 2. Log mutasi stok keluar harus tercatat tepat 1 kali
    const logs = await testDb
      .select()
      .from(stokLog)
      .where(eq(stokLog.tiketId, testTiketId));

    expect(logs.length).toBe(1);
    expect(logs[0].jumlah).toBe(4);
    expect(logs[0].stokSebelum).toBe(10);
    expect(logs[0].stokSesudah).toBe(6);
  });
});

