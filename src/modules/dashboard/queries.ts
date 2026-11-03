import { count, countDistinct, eq, and, lte, gte, isNull, asc } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { jadwal, barang, tiket } from '@/db/schema/domain';
import { toWibDateString, getWibCurrentWeekRange } from '@/lib/dates';
import { getPbgDueSoon } from '@/modules/pbg/queries';

export interface AdminDashboardData {
  totalPegawai: number;
  penugasanHariIni: {
    total: number;
    pegawaiUnik: number;
    loket: number;
    kecamatan: number;
    kantor: number;
    lainnya: number;
  };
  alerts: {
    stokMenipis: {
      count: number;
      items: Array<{ id: string; nama: string; stok: number; limitStok: number; satuan: string | null }>;
    };
    tiketMenunggu: number;
    jadwalMenunggu: {
      count: number;
      items: Array<{ id: string; judul: string; pegawaiName: string; tanggal: string; lokasiTipe: string }>;
    };
    pbgDueSoon: {
      count: number;
      items: Array<{ id: string; pemohon: string; nominal: string; jatuhTempo: string; noSkrd: string }>;
    };
  };
}

export interface PegawaiDashboardData {
  weekRange: {
    mondayDateStr: string;
    sundayDateStr: string;
  };
  totalTugas: number;
  selesai: number;
  menungguVerifikasi: number;
  belumDikerjakan: number;
  progressPersen: number;
  tugasMingguIni: Array<{
    id: string;
    judul: string;
    lokasiTipe: 'LOKET' | 'KECAMATAN' | 'KANTOR' | 'LAINNYA';
    alamatLokasi: string | null;
    status: 'BELUM_DIKERJAKAN' | 'MENUNGGU_VERIFIKASI' | 'SELESAI' | 'DITOLAK';
    tanggal: string; // YYYY-MM-DD
    catatanVerifikator: string | null;
  }>;
  tiketAktifCount: number;
}

/**
 * Mengambil statistik terpusat untuk Dashboard Administrator
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardData> {
  const todayStr = toWibDateString(new Date());

  // 1. Total Pegawai Aktif
  const [pegawaiRow] = await db
    .select({ total: count() })
    .from(user)
    .where(and(eq(user.role, 'PEGAWAI'), eq(user.aktif, true)));

  // 2. Penugasan Hari Ini dihitung di SQL:
  // Segmen donut: JUMLAH TUGAS (count()) per lokasi_tipe
  const penugasanGrouped = await db
    .select({
      lokasiTipe: jadwal.lokasiTipe,
      total: count(jadwal.id),
    })
    .from(jadwal)
    .where(eq(jadwal.tanggal, todayStr))
    .groupBy(jadwal.lokasiTipe);

  let loket = 0;
  let kecamatan = 0;
  let kantor = 0;
  let lainnya = 0;

  for (const item of penugasanGrouped) {
    const val = Number(item.total);
    if (item.lokasiTipe === 'LOKET') loket = val;
    else if (item.lokasiTipe === 'KECAMATAN') kecamatan = val;
    else if (item.lokasiTipe === 'KANTOR') kantor = val;
    else if (item.lokasiTipe === 'LAINNYA') lainnya = val;
  }

  // Hitung total pegawai unik bertugas hari ini lintas seluruh lokasi
  const [totalBertugasRow] = await db
    .select({ total: countDistinct(jadwal.pegawaiId) })
    .from(jadwal)
    .where(eq(jadwal.tanggal, todayStr));

  const totalPenugasan = Number(totalBertugasRow?.total ?? 0);

  // 3. Hal yang Butuh Tindakan (Alerts)
  // a. Stok ATK/Aset menipis (stok <= limit_stok) dan tidak diarsipkan, dihitung murni di SQL
  const lowStockItems = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      stok: barang.stok,
      limitStok: barang.limitStok,
      satuan: barang.satuan,
    })
    .from(barang)
    .where(and(isNull(barang.diarsipkanPada), lte(barang.stok, barang.limitStok)))
    .limit(5);

  const [lowStockCountRow] = await db
    .select({ total: count() })
    .from(barang)
    .where(and(isNull(barang.diarsipkanPada), lte(barang.stok, barang.limitStok)));

  const totalStokMenipis = Number(lowStockCountRow?.total ?? 0);

  // b. Tiket menunggu ACC / verifikasi
  const [tiketCountRow] = await db
    .select({ total: count() })
    .from(tiket)
    .where(eq(tiket.status, 'MENUNGGU'));

  // c. Jadwal menunggu verifikasi laporan tugas (top 5 untuk panel antrean verifikasi)
  const jadwalMenungguRows = await db
    .select({
      id: jadwal.id,
      judul: jadwal.judul,
      tanggal: jadwal.tanggal,
      lokasiTipe: jadwal.lokasiTipe,
      pegawaiName: user.name,
    })
    .from(jadwal)
    .innerJoin(user, eq(jadwal.pegawaiId, user.id))
    .where(eq(jadwal.status, 'MENUNGGU_VERIFIKASI'))
    .orderBy(asc(jadwal.tanggal))
    .limit(5);

  const [jadwalCountRow] = await db
    .select({ total: count() })
    .from(jadwal)
    .where(eq(jadwal.status, 'MENUNGGU_VERIFIKASI'));

  // d. PBG jatuh tempo <= 3 hari
  const pbgDueList = await getPbgDueSoon();

  const sumOfSegments = loket + kecamatan + kantor + lainnya;

  return {
    totalPegawai: Number(pegawaiRow?.total ?? 0),
    penugasanHariIni: {
      total: sumOfSegments, // Konsisten dengan jumlah seluruh segmen donut chart
      pegawaiUnik: totalPenugasan, // Pegawai unik bertugas lintas seluruh lokasi
      loket,
      kecamatan,
      kantor,
      lainnya,
    },
    alerts: {
      stokMenipis: {
        count: totalStokMenipis,
        items: lowStockItems,
      },
      tiketMenunggu: Number(tiketCountRow?.total ?? 0),
      jadwalMenunggu: {
        count: Number(jadwalCountRow?.total ?? 0),
        items: jadwalMenungguRows,
      },
      pbgDueSoon: {
        count: pbgDueList.length,
        items: pbgDueList.slice(0, 5).map((p) => ({
          id: p.id,
          pemohon: p.pemohon,
          nominal: p.nominal,
          jatuhTempo: p.jatuhTempo,
          noSkrd: p.noSkrd,
        })),
      },
    },
  };
}

/**
 * Mengambil ringkasan tugas dan progres minggu ini untuk Dashboard Pegawai
 */
export async function getPegawaiDashboardStats(userId: string): Promise<PegawaiDashboardData> {
  const { mondayDateStr, sundayDateStr } = getWibCurrentWeekRange();

  // Ambil daftar tugas minggu ini milik pegawai
  const tasks = await db
    .select({
      id: jadwal.id,
      judul: jadwal.judul,
      lokasiTipe: jadwal.lokasiTipe,
      alamatLokasi: jadwal.alamatLokasi,
      status: jadwal.status,
      tanggal: jadwal.tanggal,
      catatanVerifikator: jadwal.catatanVerifikator,
    })
    .from(jadwal)
    .where(
      and(
        eq(jadwal.pegawaiId, userId),
        gte(jadwal.tanggal, mondayDateStr),
        lte(jadwal.tanggal, sundayDateStr)
      )
    )
    .orderBy(asc(jadwal.tanggal));

  const totalTugas = tasks.length;
  const selesai = tasks.filter((t) => t.status === 'SELESAI').length;
  const menungguVerifikasi = tasks.filter((t) => t.status === 'MENUNGGU_VERIFIKASI').length;
  const belumDikerjakan = tasks.filter((t) => t.status === 'BELUM_DIKERJAKAN').length;
  const progressPersen = totalTugas > 0 ? Math.round((selesai / totalTugas) * 100) : 100;

  // Tiket aktif pegawai (status MENUNGGU)
  const [tiketRow] = await db
    .select({ total: count() })
    .from(tiket)
    .where(and(eq(tiket.pemohonId, userId), eq(tiket.status, 'MENUNGGU')));

  return {
    weekRange: {
      mondayDateStr,
      sundayDateStr,
    },
    totalTugas,
    selesai,
    menungguVerifikasi,
    belumDikerjakan,
    progressPersen,
    tugasMingguIni: tasks,
    tiketAktifCount: tiketRow?.total ?? 0,
  };
}
