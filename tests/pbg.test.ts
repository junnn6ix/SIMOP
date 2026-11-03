import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb } from '@/db';
import { pbg } from '@/db/schema/domain';
import { user, account } from '@/db/schema/auth';
import { normalizeWaNumber, createPbgSchema } from '@/modules/pbg/schema';
import { getPbgDueSoon } from '@/modules/pbg/queries';
import { toWibDateString } from '@/lib/dates';

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST ||
  'postgresql://neondb_owner:npg_E8kHS4pZMgol@ep-gentle-queen-azt739wp-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require';

describe('Fase 4: Monitoring Retribusi PBG - Unit & Normalisasi Schema', () => {
  it('normalizes various Indonesian WhatsApp formats to standard 628xxx format', () => {
    expect(normalizeWaNumber('081234567890')).toBe('6281234567890');
    expect(normalizeWaNumber('81234567890')).toBe('6281234567890');
    expect(normalizeWaNumber('+62 812-3456-7890')).toBe('6281234567890');
    expect(normalizeWaNumber('6281234567890')).toBe('6281234567890');
  });

  it('validates createPbgSchema requiring positive nominal and valid SKRD', () => {
    const valid = createPbgSchema.parse({
      pemohon: 'PT Karawang Megah Properti',
      noWa: '081298765432',
      noSkrd: 'SKRD/2026/PBG/001',
      lokasi: 'Jl. Interchange Tol Karawang Barat No. 8',
      nominal: 25000000,
      jatuhTempo: '2026-11-20',
    });

    expect(valid.noWa).toBe('6281298765432');
    expect(valid.nominal).toBe(25000000);
    expect(valid.noSkrd).toBe('SKRD/2026/PBG/001');

    // Nominal 0 atau negatif ditolak
    expect(() =>
      createPbgSchema.parse({
        pemohon: 'PT Gagal',
        noWa: '081298765432',
        noSkrd: 'SKRD-ERR',
        lokasi: 'Karawang',
        nominal: 0,
        jatuhTempo: '2026-11-20',
      })
    ).toThrow('Nominal retribusi PBG harus lebih besar dari 0');
  });
});

describe('Fase 4: Retribusi PBG - Database Integration (neondb_test)', () => {
  let testDb: ReturnType<typeof createTestDb>['testDb'];
  let testPool: ReturnType<typeof createTestDb>['testPool'];

  const testAdminId = `test-pbg-adm-${crypto.randomUUID().slice(0, 8)}`;
  const createdPbgIds: string[] = [];

  beforeAll(async () => {
    const conn = createTestDb(TEST_DB_URL);
    testDb = conn.testDb;
    testPool = conn.testPool;

    // Buat akun admin uji
    await testDb.insert(user).values({
      id: testAdminId,
      name: 'Admin PBG Test',
      email: `${testAdminId}@simop.local`,
      username: testAdminId,
      displayUsername: testAdminId,
      role: 'ADMIN',
      bidang: 'PTSP',
      aktif: true,
      banned: false,
    });
  });

  afterAll(async () => {
    try {
      for (const id of createdPbgIds) {
        await testDb.delete(pbg).where(eq(pbg.id, id));
      }
      await testDb.delete(account).where(eq(account.userId, testAdminId));
      await testDb.delete(user).where(eq(user.id, testAdminId));
    } finally {
      await testPool.end();
    }
  });

  it('rejects duplicate SKRD in database', async () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const uniqueSkrd = `SKRD-TEST-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    createdPbgIds.push(id1);

    await testDb.insert(pbg).values({
      id: id1,
      pemohon: 'Budi Test',
      noWa: '6281234567890',
      noSkrd: uniqueSkrd,
      lokasi: 'Klari, Karawang',
      nominal: '10000000.00',
      jatuhTempo: '2026-12-01',
      status: 'BELUM_BAYAR',
    });

    // Percobaan kedua dengan nomor SKRD yang sama harus melempar error unique violation
    await expect(
      testDb.insert(pbg).values({
        id: id2,
        pemohon: 'Siti Duplikat',
        noWa: '6281234567891',
        noSkrd: uniqueSkrd,
        lokasi: 'Telukjambe, Karawang',
        nominal: '12000000.00',
        jatuhTempo: '2026-12-01',
        status: 'BELUM_BAYAR',
      })
    ).rejects.toThrow();
  });

  it('updates status to LUNAS and sets dibayar_pada timestamp, and unmarking clears dibayar_pada', async () => {
    const id = crypto.randomUUID();
    const skrd = `SKRD-LUNAS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    createdPbgIds.push(id);

    await testDb.insert(pbg).values({
      id,
      pemohon: 'Pelunasan Test',
      noWa: '6281234567890',
      noSkrd: skrd,
      lokasi: 'Karawang Timur',
      nominal: '15000000.00',
      jatuhTempo: '2026-11-25',
      status: 'BELUM_BAYAR',
      dibayarPada: null,
    });

    // 1. Tandai Lunas
    const paidTime = new Date();
    await testDb
      .update(pbg)
      .set({
        status: 'LUNAS',
        dibayarPada: paidTime,
        updatedAt: paidTime,
      })
      .where(eq(pbg.id, id));

    const [paidRow] = await testDb.select().from(pbg).where(eq(pbg.id, id));
    expect(paidRow.status).toBe('LUNAS');
    expect(paidRow.dibayarPada).toBeDefined();
    expect(paidRow.dibayarPada).not.toBeNull();

    // 2. Batalkan Lunas
    await testDb
      .update(pbg)
      .set({
        status: 'BELUM_BAYAR',
        dibayarPada: null,
        updatedAt: new Date(),
      })
      .where(eq(pbg.id, id));

    const [unpaidRow] = await testDb.select().from(pbg).where(eq(pbg.id, id));
    expect(unpaidRow.status).toBe('BELUM_BAYAR');
    expect(unpaidRow.dibayarPada).toBeNull();
  });

  it('strictly computes getPbgDueSoon via SQL (excludes LUNAS, excludes past due, includes <= 3 days, excludes > 3 days)', async () => {
    const today = new Date();
    const todayStr = toWibDateString(today);

    // Tanggal H+2 (dalam rentang due soon <= 3 hari)
    const in2Days = new Date(today);
    in2Days.setDate(in2Days.getDate() + 2);
    const in2DaysStr = toWibDateString(in2Days);

    // Tanggal H+5 (di luar rentang > 3 hari)
    const in5Days = new Date(today);
    in5Days.setDate(in5Days.getDate() + 5);
    const in5DaysStr = toWibDateString(in5Days);

    // Tanggal H-2 (sudah lewat jatuh tempo)
    const past2Days = new Date(today);
    past2Days.setDate(past2Days.getDate() - 2);
    const past2DaysStr = toWibDateString(past2Days);

    const prefix = `DUE-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // Item A: BELUM_BAYAR dan jatuh tempo H+2 (HARUS MASUK)
    const idA = crypto.randomUUID();
    createdPbgIds.push(idA);
    await testDb.insert(pbg).values({
      id: idA,
      pemohon: 'Pemohon A (H+2 Belum Bayar)',
      noWa: '6281234567890',
      noSkrd: `${prefix}-A`,
      lokasi: 'Karawang',
      nominal: '5000000.00',
      jatuhTempo: in2DaysStr,
      status: 'BELUM_BAYAR',
    });

    // Item B: LUNAS dan jatuh tempo H+2 (TIDAK BOLEH MASUK KARENA SUDAH LUNAS)
    const idB = crypto.randomUUID();
    createdPbgIds.push(idB);
    await testDb.insert(pbg).values({
      id: idB,
      pemohon: 'Pemohon B (H+2 Sudah Lunas)',
      noWa: '6281234567890',
      noSkrd: `${prefix}-B`,
      lokasi: 'Karawang',
      nominal: '6000000.00',
      jatuhTempo: in2DaysStr,
      status: 'LUNAS',
      dibayarPada: new Date(),
    });

    // Item C: BELUM_BAYAR tapi jatuh tempo H+5 (TIDAK BOLEH MASUK KARENA > 3 HARI)
    const idC = crypto.randomUUID();
    createdPbgIds.push(idC);
    await testDb.insert(pbg).values({
      id: idC,
      pemohon: 'Pemohon C (H+5 Belum Bayar)',
      noWa: '6281234567890',
      noSkrd: `${prefix}-C`,
      lokasi: 'Karawang',
      nominal: '7000000.00',
      jatuhTempo: in5DaysStr,
      status: 'BELUM_BAYAR',
    });

    // Item D: BELUM_BAYAR tapi sudah lewat (TIDAK BOLEH MASUK KARENA SUDAH KEDALUWARSA)
    const idD = crypto.randomUUID();
    createdPbgIds.push(idD);
    await testDb.insert(pbg).values({
      id: idD,
      pemohon: 'Pemohon D (Lewat Jatuh Tempo)',
      noWa: '6281234567890',
      noSkrd: `${prefix}-D`,
      lokasi: 'Karawang',
      nominal: '8000000.00',
      jatuhTempo: past2DaysStr,
      status: 'BELUM_BAYAR',
    });

    // Eksekusi fungsi domain getPbgDueSoon secara langsung dengan parameter waktu saat ini
    const dueSoonItems = await getPbgDueSoon(today, testDb);
    const dueSoonIds = dueSoonItems.map((i) => i.id);

    // Item A WAJIB ada
    expect(dueSoonIds).toContain(idA);
    // Item B, C, D TIDAK BOLEH ada
    expect(dueSoonIds).not.toContain(idB);
    expect(dueSoonIds).not.toContain(idC);
    expect(dueSoonIds).not.toContain(idD);
  });

  it('strictly handles locked WIB midnight boundary (23:59 vs 00:01) and +3 days window', async () => {
    // Kunci hari acuan:
    // Waktu 1: 2026-11-03 23:59:00 WIB (+07:00) -> Hari ini adalah 2026-11-03, Rentang H+3 adalah 2026-11-03 s.d. 2026-11-06
    const midnightBefore = new Date('2026-11-03T23:59:00+07:00');
    // Waktu 2: 2026-11-04 00:01:00 WIB (+07:00) -> Hari ini adalah 2026-11-04, Rentang H+3 adalah 2026-11-04 s.d. 2026-11-07
    const midnightAfter = new Date('2026-11-04T00:01:00+07:00');

    const prefix = `MID-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // Item 1: Jatuh tempo 2026-11-03 (Hari pertama di Waktu 1, tapi sudah lewat/kemarin di Waktu 2)
    const idDay3 = crypto.randomUUID();
    createdPbgIds.push(idDay3);
    await testDb.insert(pbg).values({
      id: idDay3,
      pemohon: 'Uji Batas Hari 3',
      noWa: '6281234567890',
      noSkrd: `${prefix}-03`,
      lokasi: 'Karawang Barat',
      nominal: '3000000.00',
      jatuhTempo: '2026-11-03',
      status: 'BELUM_BAYAR',
    });

    // Item 2: Jatuh tempo 2026-11-06 (Hari ke-3 di Waktu 1: masuk; Hari ke-2 di Waktu 2: masuk)
    const idDay6 = crypto.randomUUID();
    createdPbgIds.push(idDay6);
    await testDb.insert(pbg).values({
      id: idDay6,
      pemohon: 'Uji Batas Hari 6',
      noWa: '6281234567890',
      noSkrd: `${prefix}-06`,
      lokasi: 'Klari',
      nominal: '4000000.00',
      jatuhTempo: '2026-11-06',
      status: 'BELUM_BAYAR',
    });

    // Item 3: Jatuh tempo 2026-11-07 (Hari ke-4 di Waktu 1: DI LUAR RENTANG; Hari ke-3 di Waktu 2: MASUK)
    const idDay7 = crypto.randomUUID();
    createdPbgIds.push(idDay7);
    await testDb.insert(pbg).values({
      id: idDay7,
      pemohon: 'Uji Batas Hari 7',
      noWa: '6281234567890',
      noSkrd: `${prefix}-07`,
      lokasi: 'Cikampek',
      nominal: '5000000.00',
      jatuhTempo: '2026-11-07',
      status: 'BELUM_BAYAR',
    });

    // Uji pada Waktu 1 (23:59 WIB pada 2026-11-03):
    const results1 = await getPbgDueSoon(midnightBefore, testDb);
    const ids1 = results1.map((r) => r.id);
    expect(ids1).toContain(idDay3); // Masuk (hari ini)
    expect(ids1).toContain(idDay6); // Masuk (H+3)
    expect(ids1).not.toContain(idDay7); // Di luar (H+4)

    // Uji pada Waktu 2 (00:01 WIB pada 2026-11-04):
    const results2 = await getPbgDueSoon(midnightAfter, testDb);
    const ids2 = results2.map((r) => r.id);
    expect(ids2).not.toContain(idDay3); // Dikeluarkan (sudah kedaluwarsa/lewat 1 hari)
    expect(ids2).toContain(idDay6); // Masuk (H+2)
    expect(ids2).toContain(idDay7); // Masuk (H+3)
  });
});
