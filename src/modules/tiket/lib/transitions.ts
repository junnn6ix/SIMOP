export type TiketStatus =
  | 'MENUNGGU'
  | 'ACC'
  | 'MAINTENANCE'
  | 'DITOLAK'
  | 'SELESAI';

export type TiketJenis = 'PERMINTAAN_BARANG' | 'LAPOR_KERUSAKAN';

/**
 * Memvalidasi transisi status tiket layanan sesuai aturan ketat domain SIMOP:
 * - MENUNGGU -> ACC, DITOLAK, atau MAINTENANCE (khusus laporan kerusakan)
 * - MAINTENANCE -> SELESAI
 * - ACC -> SELESAI
 * Transisi selain yang terdaftar ditolak dengan pesan error deskriptif.
 */
export function validateTiketTransition(
  currentStatus: TiketStatus,
  targetStatus: TiketStatus,
  jenis?: TiketJenis
): void {
  if (currentStatus === targetStatus) {
    throw new Error(`Tiket sudah berada pada status ${currentStatus}.`);
  }

  // 1. Dari MENUNGGU
  if (currentStatus === 'MENUNGGU') {
    if (targetStatus === 'ACC' || targetStatus === 'DITOLAK') {
      return;
    }
    if (targetStatus === 'MAINTENANCE') {
      if (jenis && jenis !== 'LAPOR_KERUSAKAN') {
        throw new Error('Status MAINTENANCE hanya berlaku untuk tiket jenis LAPOR_KERUSAKAN.');
      }
      return;
    }
    throw new Error(
      `Tiket berstatus MENUNGGU hanya dapat dialihkan ke ACC, DITOLAK, atau MAINTENANCE (tidak dapat langsung ke ${targetStatus}).`
    );
  }

  // 2. Dari ACC
  if (currentStatus === 'ACC') {
    if (targetStatus === 'SELESAI') {
      return;
    }
    if (targetStatus === 'MAINTENANCE' && jenis === 'LAPOR_KERUSAKAN') {
      return;
    }
    throw new Error(
      `Tiket yang telah disetujui (ACC) hanya dapat dialihkan ke status SELESAI (atau MAINTENANCE untuk kerusakan).`
    );
  }

  // 3. Dari MAINTENANCE
  if (currentStatus === 'MAINTENANCE') {
    if (targetStatus === 'SELESAI') {
      return;
    }
    throw new Error('Tiket dalam proses MAINTENANCE hanya dapat dialihkan ke status SELESAI.');
  }

  // 4. Status final
  if (currentStatus === 'SELESAI' || currentStatus === 'DITOLAK') {
    throw new Error(
      `Tiket dengan status akhir ${currentStatus} bersifat permanen dan tidak dapat diubah statusnya lagi.`
    );
  }

  throw new Error(`Transisi status tiket dari ${currentStatus} ke ${targetStatus} tidak diizinkan.`);
}

