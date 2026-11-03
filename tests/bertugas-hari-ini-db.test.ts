import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, inArray, count, countDistinct } from 'drizzle-orm';
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

  it('guarantees segments represent task counts (total 4) while distinct employees equals 2', async () => {
    // 1. Kueri grouped per lokasi_tipe: jumlah TUGAS (count(jadwal.id)) untuk segmen donut
    const grouped = await testDb
      .select({
        lokasiTipe: jadwal.lokasiTipe,
        totalTugas: count(jadwal.id),
      })
      .from(jadwal)
      .where(and(inArray(jadwal.id, createdJadwalIds), eq(jadwal.tanggal, todayStr)))
      .groupBy(jadwal.lokasiTipe);

    const loketRow = grouped.find((g) => g.lokasiTipe === 'LOKET');
    const kantorRow = grouped.find((g) => g.lokasiTipe === 'KANTOR');

    // Di LOKET ada 3 tugas (2 milik Pegawai A, 1 milik Pegawai B) -> 3 tugas
    expect(Number(loketRow?.totalTugas)).toBe(3);

    // Di KANTOR ada 1 tugas milik Pegawai A -> 1 tugas
    expect(Number(kantorRow?.totalTugas)).toBe(1);

    const loket = Number(loketRow?.totalTugas ?? 0);
    const kantor = Number(kantorRow?.totalTugas ?? 0);
    const kecamatan = 0;
    const lainnya = 0;

    // 2. Kueri total pegawai bertugas hari ini lintas seluruh lokasi untuk kartu "Bertugas Hari Ini"
    // Total ada 4 baris jadwal, namun hanya melibatkan 2 pegawai unik (Pegawai A dan Pegawai B)
    const [totalRow] = await testDb
      .select({
        totalPegawaiBertugas: countDistinct(jadwal.pegawaiId),
      })
      .from(jadwal)
      .where(and(inArray(jadwal.id, createdJadwalIds), eq(jadwal.tanggal, todayStr)));

    expect(Number(totalRow?.totalPegawaiBertugas)).toBe(2);

    // 3. Konsistensi Pusat Donut dengan Jumlah Segmen:
    // Pusat donut didefinisikan sebagai Total Tugas hari ini (sum of segments: loket + kantor + kecamatan + lainnya).
    // Pada data uji ini: 3 di loket + 1 di kantor = 4 tugas!
    const donutTotal = loket + kantor + kecamatan + lainnya;
    expect(donutTotal).toBe(4);

    // Pastikan penjumlahan segmen donut persis sama dengan nilai pusat donut
    const donutSegments = [
      { label: 'Kantor Dinas', value: kantor },
      { label: 'Loket Pelayanan', value: loket },
      { label: 'Layanan Kecamatan', value: kecamatan },
      { label: 'Lainnya / Lapangan', value: lainnya },
    ];
    const sumOfSegments = donutSegments.reduce((sum, s) => sum + s.value, 0);
    expect(donutTotal).toBe(sumOfSegments);
  });
});

