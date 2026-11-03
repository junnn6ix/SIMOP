import { toDate, toWibDateString } from '@/lib/dates';

export type LokasiTipe = 'LOKET' | 'KECAMATAN' | 'KANTOR' | 'LAINNYA';

export interface GenerateJadwalParams {
  judul: string;
  deskripsi?: string;
  tanggalMulai: Date | string;
  tanggalSelesai: Date | string;
  pegawaiIds: string[];
  lokasiTipe: LokasiTipe;
  alamatLokasi?: string;
  skipWeekends?: boolean;
}

export interface GeneratedJadwalItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggal: string; // YYYY-MM-DD
  pegawaiId: string;
  lokasiTipe: LokasiTipe;
  alamatLokasi: string | null;
  status: 'BELUM_DIKERJAKAN';
}

/**
 * Generator jadwal tugas rentang tanggal untuk banyak pegawai sekaligus.
 * Memvalidasi batas maksimal rentang 31 hari dan memfilter hari akhir pekan (Sabtu & Minggu).
 * Menghasilkan tanggal kalender murni YYYY-MM-DD (1 baris per hari per pegawai).
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

  const startTime = new Date(start);
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date(end);
  endTime.setHours(23, 59, 59, 999);

  if (endTime < startTime) {
    throw new Error('Tanggal selesai tidak boleh mendahului tanggal mulai.');
  }

  const diffMs = endTime.getTime() - startTime.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 31) {
    throw new Error('Rentang pembuatan jadwal maksimal adalah 31 hari.');
  }

  const items: GeneratedJadwalItem[] = [];

  const current = new Date(startTime);
  while (current <= endTime) {
    const dayOfWeek = current.getDay(); // 0 = Minggu, 6 = Sabtu

    if (!(skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6))) {
      const tanggalString = toWibDateString(current);

      for (const pegawaiId of pegawaiIds) {
        items.push({
          id: crypto.randomUUID(),
          judul: judul.trim(),
          deskripsi: deskripsi?.trim() || null,
          tanggal: tanggalString,
          pegawaiId,
          lokasiTipe,
          alamatLokasi: alamatLokasi?.trim() || null,
          status: 'BELUM_DIKERJAKAN',
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return items;
}

export interface ValidateStatusParams {
  currentStatus: 'BELUM_DIKERJAKAN' | 'MENUNGGU_VERIFIKASI' | 'SELESAI' | 'DITOLAK' | string;
  targetStatus: 'BELUM_DIKERJAKAN' | 'MENUNGGU_VERIFIKASI' | 'SELESAI' | 'DITOLAK' | string;
  catatanVerifikator?: string | null;
}

/**
 * Validasi transisi status tugas
 */
export function validateStatusTransition(params: ValidateStatusParams): void {
  const { currentStatus, targetStatus, catatanVerifikator } = params;

  if (currentStatus === 'BELUM_DIKERJAKAN' && targetStatus === 'MENUNGGU_VERIFIKASI') {
    return;
  }

  if (currentStatus === 'MENUNGGU_VERIFIKASI' && targetStatus === 'SELESAI') {
    return;
  }

  if (currentStatus === 'MENUNGGU_VERIFIKASI' && targetStatus === 'BELUM_DIKERJAKAN') {
    if (!catatanVerifikator || catatanVerifikator.trim().length === 0) {
      throw new Error('Catatan verifikator wajib diisi saat menolak laporan tugas.');
    }
    return;
  }

  throw new Error(`Transisi status jadwal dari ${currentStatus} ke ${targetStatus} tidak diizinkan.`);
}
