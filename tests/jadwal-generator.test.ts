import { describe, it, expect } from 'vitest';
import {
  generateJadwalRange,
  validateStatusTransition,
} from '@/modules/jadwal/lib/generator';

describe('Jadwal Generator & Status Transitions', () => {
  it('generates items for multiple employees while skipping weekends by default', () => {
    // 2026-11-06 (Jumat) s/d 2026-11-09 (Senin) -> 4 hari total: Jumat, Sabtu, Minggu, Senin
    // Dengan skipWeekends: Jumat (1) dan Senin (1) = 2 hari kerja
    const items = generateJadwalRange({
      judul: 'Patroli Perizinan Kawasan Industri',
      tanggalMulai: new Date('2026-11-06T00:00:00.000Z'),
      tanggalSelesai: new Date('2026-11-09T00:00:00.000Z'),
      pegawaiIds: ['pegawai-1', 'pegawai-2'],
      lokasiTipe: 'LUAR_KANTOR',
      alamatLokasi: 'Kawasan KIIC Karawang',
      skipWeekends: true,
    });

    // 2 hari kerja * 2 pegawai = 4 item
    expect(items.length).toBe(4);
    expect(items.every((i) => i.status === 'BELUM_DIKERJAKAN')).toBe(true);
    expect(items.every((i) => i.lokasiTipe === 'LUAR_KANTOR')).toBe(true);

    // Pastikan tidak ada jadwal di hari Sabtu (6) atau Minggu (0)
    items.forEach((item) => {
      const day = item.tanggalMulai.getDay();
      expect(day).not.toBe(0);
      expect(day).not.toBe(6);
    });
  });

  it('includes weekends when skipWeekends is false', () => {
    const items = generateJadwalRange({
      judul: 'Piket Pelayanan Akhir Pekan',
      tanggalMulai: new Date('2026-11-06T00:00:00.000Z'),
      tanggalSelesai: new Date('2026-11-09T00:00:00.000Z'),
      pegawaiIds: ['pegawai-1'],
      lokasiTipe: 'DALAM_KANTOR',
      skipWeekends: false,
    });

    // 4 hari total * 1 pegawai = 4 item
    expect(items.length).toBe(4);
  });

  it('rejects range greater than 31 days', () => {
    expect(() =>
      generateJadwalRange({
        judul: 'Tugas Terlalu Lama',
        tanggalMulai: new Date('2026-10-01T00:00:00.000Z'),
        tanggalSelesai: new Date('2026-11-15T00:00:00.000Z'), // > 40 hari
        pegawaiIds: ['pegawai-1'],
        lokasiTipe: 'DALAM_KANTOR',
      })
    ).toThrow('Rentang pembuatan jadwal maksimal adalah 31 hari.');
  });

  it('validates status transition: BELUM_DIKERJAKAN -> MENUNGGU_VERIFIKASI', () => {
    expect(() =>
      validateStatusTransition({
        currentStatus: 'BELUM_DIKERJAKAN',
        targetStatus: 'MENUNGGU_VERIFIKASI',
      })
    ).not.toThrow();
  });

  it('validates status transition: MENUNGGU_VERIFIKASI -> SELESAI (ACC)', () => {
    expect(() =>
      validateStatusTransition({
        currentStatus: 'MENUNGGU_VERIFIKASI',
        targetStatus: 'SELESAI',
      })
    ).not.toThrow();
  });

  it('validates status transition: MENUNGGU_VERIFIKASI -> BELUM_DIKERJAKAN (Tolak) requires catatan', () => {
    // Tanpa catatan -> harus melempar error
    expect(() =>
      validateStatusTransition({
        currentStatus: 'MENUNGGU_VERIFIKASI',
        targetStatus: 'BELUM_DIKERJAKAN',
        catatanVerifikator: '',
      })
    ).toThrow('Catatan verifikator wajib diisi saat menolak laporan tugas.');

    // Dengan catatan -> berhasil
    expect(() =>
      validateStatusTransition({
        currentStatus: 'MENUNGGU_VERIFIKASI',
        targetStatus: 'BELUM_DIKERJAKAN',
        catatanVerifikator: 'Foto bukti buram, mohon unggah ulang foto yang jelas.',
      })
    ).not.toThrow();
  });

  it('rejects illegal status transition: BELUM_DIKERJAKAN directly to SELESAI', () => {
    expect(() =>
      validateStatusTransition({
        currentStatus: 'BELUM_DIKERJAKAN',
        targetStatus: 'SELESAI',
      })
    ).toThrow('Transisi status tidak valid dari BELUM_DIKERJAKAN ke SELESAI.');
  });
});

