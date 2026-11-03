import { toDate } from '@/lib/dates';

export interface GenerateJadwalParams {
  judul: string;
  deskripsi?: string;
  tanggalMulai: Date | string;
  tanggalSelesai: Date | string;
  pegawaiIds: string[];
  lokasiTipe: 'DALAM_KANTOR' | 'LUAR_KANTOR';
  alamatLokasi?: string;
  skipWeekends?: boolean;
}

export interface GeneratedJadwalItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  pegawaiId: string;
  lokasiTipe: 'DALAM_KANTOR' | 'LUAR_KANTOR';
  alamatLokasi: string | null;
  status: 'BELUM_DIKERJAKAN';
}

/**
 * Generator jadwal tugas rentang tanggal untuk banyak pegawai sekaligus.
 * Memvalidasi batas maksimal rentang 31 hari dan memfilter hari akhir pekan (Sabtu & Minggu).
 */
export function generateJadwalRange(params: GenerateJadwalParams): GeneratedJadwalItem[] {
  const {
    judul,
    deskripsi,
    tanggalMulai,
    tanggalSelesai,
    pegawaiIds,
    lokasiTipe,
    alamatLokasi,
    skipWeekends = true,
  } = params;

  if (!pegawaiIds || pegawaiIds.length === 0) {
    throw new Error('Pilih minimal satu orang pegawai untuk penugasan.');
  }

  const start = toDate(tanggalMulai);
  const end = toDate(tanggalSelesai);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Format tanggal mulai atau tanggal selesai tidak valid.');
  }

  // Normalisasi waktu awal ke 08:00 WIB dan akhir ke 16:00 WIB
  const startTime = new Date(start);
  startTime.setHours(8, 0, 0, 0);

  const endTime = new Date(end);
  endTime.setHours(16, 0, 0, 0);

  if (endTime < startTime) {
    throw new Error('Tanggal selesai tidak boleh mendahului tanggal mulai.');
  }

  const diffMs = endTime.getTime() - startTime.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > 31) {
    throw new Error('Rentang pembuatan jadwal maksimal adalah 31 hari.');
  }

  const items: GeneratedJadwalItem[] = [];

  // Loop setiap hari dalam rentang
  const current = new Date(startTime);
  while (current <= endTime) {
    const dayOfWeek = current.getDay(); // 0 = Minggu, 6 = Sabtu

    // Jika skipWeekends aktif, lewati hari Sabtu (6) dan Minggu (0)
    if (!(skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6))) {
      for (const pegawaiId of pegawaiIds) {
        const itemMulai = new Date(current);
        itemMulai.setHours(8, 0, 0, 0);

        const itemSelesai = new Date(current);
        itemSelesai.setHours(16, 0, 0, 0);

        items.push({
          id: crypto.randomUUID(),
          judul: judul.trim(),
          deskripsi: deskripsi?.trim() || null,
          tanggalMulai: itemMulai,
          tanggalSelesai: itemSelesai,
          pegawaiId,
          lokasiTipe,
          alamatLokasi: alamatLokasi?.trim() || null,
          status: 'BELUM_DIKERJAKAN',
        });
      }
    }

    // Maju 1 hari
    current.setDate(current.getDate() + 1);
  }

  return items;
}

export type JadwalStatus =
  | 'BELUM_DIKERJAKAN'
  | 'MENUNGGU_VERIFIKASI'
  | 'SELESAI'
  | 'DITOLAK';

/**
 * Validasi transisi status siklus hidup jadwal tugas:
 * 1. BELUM_DIKERJAKAN -> MENUNGGU_VERIFIKASI (oleh pegawai setelah submit laporan & foto bukti)
 * 2. MENUNGGU_VERIFIKASI -> SELESAI (oleh admin via verifikasi ACC)
 * 3. MENUNGGU_VERIFIKASI -> BELUM_DIKERJAKAN (oleh admin via verifikasi Tolak, WAJIB catatan verifikator)
 */
export function validateStatusTransition(params: {
  currentStatus: JadwalStatus;
  targetStatus: JadwalStatus;
  catatanVerifikator?: string | null;
}): void {
  const { currentStatus, targetStatus, catatanVerifikator } = params;

  if (currentStatus === 'BELUM_DIKERJAKAN' && targetStatus === 'MENUNGGU_VERIFIKASI') {
    return;
  }

  if (currentStatus === 'MENUNGGU_VERIFIKASI') {
    if (targetStatus === 'SELESAI') {
      return;
    }
    if (targetStatus === 'BELUM_DIKERJAKAN') {
      if (!catatanVerifikator || !catatanVerifikator.trim()) {
        throw new Error('Catatan verifikator wajib diisi saat menolak laporan tugas.');
      }
      return;
    }
  }

  throw new Error(
    `Transisi status tidak valid dari ${currentStatus} ke ${targetStatus}.`
  );
}

