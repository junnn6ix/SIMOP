import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, inArray, countDistinct } from 'drizzle-orm';
import { createTestDb } from '@/db';
import { jadwal } from '@/db/schema/domain';
import { user } from '@/db/schema/auth';
import { toWibDateString } from '@/lib/dates';

describe('Real PostgreSQL Integration Test: Bertugas Hari Ini (countDistinct user_id per lokasi_tipe)', () => {
  let testDb: ReturnType<typeof createTestDb>['testDb'];
  let testPool: ReturnType<typeof createTestDb>['testPool'];

  const testUserA = `test-pgw-a-${crypto.randomUUID().slice(0, 8)}`;
  const testUserB = `test-pgw-b-${crypto.randomUUID().slice(0, 8)}`;
  const testJadwal1 = `test-jdw-1-${crypto.randomUUID().slice(0, 8)}`;
  const testJadwal2 = `test-jdw-2-${crypto.randomUUID().slice(0, 8)}`;
  const testJadwal3 = `test-jdw-3-${crypto.randomUUID().slice(0, 8)}`;
  const testJadwal4 = `test-jdw-4-${crypto.randomUUID().slice(0, 8)}`;

  const createdUserIds = [testUserA, testUserB];
  const createdJadwalIds = [testJadwal1, testJadwal2, testJadwal3, testJadwal4];

  const todayStr = toWibDateString(new Date());

  beforeAll(async () => {
    const conn = createTestDb();
    testDb = conn.testDb;
    testPool = conn.testPool;

    // 1. Buat 2 user pegawai uji
    await testDb.insert(user).values([
      {
        id: testUserA,
        name: 'Pegawai Uji A',
        email: `${testUserA}@simop.local`,
        username: testUserA,
        displayUsername: testUserA,
        role: 'PEGAWAI',
        bidang: 'PTSP',
        aktif: true,
      },
      {
        id: testUserB,
        name: 'Pegawai Uji B',
        email: `${testUserB}@simop.local`,
        username: testUserB,
        displayUsername: testUserB,
        role: 'PEGAWAI',
        bidang: 'PM',
        aktif: true,
      },
    ]);

    // 2. Buat jadwal:
    // Pegawai A memiliki 2 tugas berbeda di LOKET pada hari yang sama (todayStr)
    // Pegawai A juga memiliki 1 tugas di KANTOR pada hari yang sama
    // Pegawai B memiliki 1 tugas di LOKET pada hari yang sama
    await testDb.insert(jadwal).values([
      {
        id: testJadwal1,
        judul: 'Tugas Pagi Loket A',
        tanggal: todayStr,
        pegawaiId: testUserA,
        lokasiTipe: 'LOKET',
        status: 'BELUM_DIKERJAKAN',
      },
      {
        id: testJadwal2,
        judul: 'Tugas Siang Loket A (Pegawai Sama, Hari Sama)',
        tanggal: todayStr,
        pegawaiId: testUserA,
        lokasiTipe: 'LOKET',
        status: 'BELUM_DIKERJAKAN',
      },
      {
        id: testJadwal3,
        judul: 'Tugas Sore Kantor A',
        tanggal: todayStr,
        pegawaiId: testUserA,
        lokasiTipe: 'KANTOR',
        status: 'BELUM_DIKERJAKAN',
      },
      {
        id: testJadwal4,
        judul: 'Tugas Loket B',
        tanggal: todayStr,
        pegawaiId: testUserB,
        lokasiTipe: 'LOKET',
        status: 'BELUM_DIKERJAKAN',
      },
    ]);
  });

  afterAll(async () => {
    try {
      await testDb.delete(jadwal).where(inArray(jadwal.id, createdJadwalIds));
      await testDb.delete(user).where(inArray(user.id, createdUserIds));
    } finally {
      await testPool.end();
    }
  });

  it('guarantees that one employee with multiple tasks on the same day is counted as 1 distinct employee', async () => {
    // 1. Kueri grouped per lokasi_tipe dengan countDistinct(jadwal.pegawaiId)
    const grouped = await testDb
      .select({
        lokasiTipe: jadwal.lokasiTipe,
        totalPegawaiUnik: countDistinct(jadwal.pegawaiId),
      })
      .from(jadwal)
      .where(and(inArray(jadwal.id, createdJadwalIds), eq(jadwal.tanggal, todayStr)))
      .groupBy(jadwal.lokasiTipe);

    const loketRow = grouped.find((g) => g.lokasiTipe === 'LOKET');
    const kantorRow = grouped.find((g) => g.lokasiTipe === 'KANTOR');

    // Di LOKET ada 3 tugas (2 milik Pegawai A, 1 milik Pegawai B),
    // berkat countDistinct harus tepat menghasilkan 2 pegawai unik (bukan 3 baris tugas)
    expect(Number(loketRow?.totalPegawaiUnik)).toBe(2);

    // Di KANTOR ada 1 tugas milik Pegawai A -> 1 pegawai unik
    expect(Number(kantorRow?.totalPegawaiUnik)).toBe(1);

    // 2. Kueri total pegawai bertugas hari ini lintas seluruh lokasi
    // Total ada 4 baris jadwal, namun hanya melibatkan 2 pegawai unik (Pegawai A dan Pegawai B)
    const [totalRow] = await testDb
      .select({
        totalPegawaiBertugas: countDistinct(jadwal.pegawaiId),
      })
      .from(jadwal)
      .where(and(inArray(jadwal.id, createdJadwalIds), eq(jadwal.tanggal, todayStr)));

    expect(Number(totalRow?.totalPegawaiBertugas)).toBe(2);
  });
});

