import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'PEGAWAI']);

export const bidangEnum = pgEnum('bidang', [
  'SEKRETARIAT',
  'PTSP',
  'PM',
  'PENGAWASAN',
]);

export const lokasiTipeEnum = pgEnum('lokasi_tipe', [
  'LOKET',
  'KECAMATAN',
  'KANTOR',
  'LAINNYA',
]);

export const jadwalStatusEnum = pgEnum('jadwal_status', [
  'BELUM_DIKERJAKAN',
  'MENUNGGU_VERIFIKASI',
  'SELESAI',
  'DITOLAK',
]);

export const barangKategoriEnum = pgEnum('barang_kategori', ['ATK', 'ASET']);

export const tiketJenisEnum = pgEnum('tiket_jenis', [
  'PERMINTAAN_BARANG',
  'LAPOR_KERUSAKAN',
]);

export const tiketStatusEnum = pgEnum('tiket_status', [
  'MENUNGGU',
  'ACC',
  'MAINTENANCE',
  'DITOLAK',
  'SELESAI',
]);

export const stokTipeEnum = pgEnum('stok_tipe', [
  'MASUK',
  'KELUAR',
  'PENYESUAIAN',
]);

export const pbgStatusEnum = pgEnum('pbg_status', [
  'BELUM_BAYAR',
  'LUNAS',
]);

export const notifikasiStatusEnum = pgEnum('notifikasi_status', [
  'TERKIRIM',
  'GAGAL',
  'DRY_RUN',
  'PENDING',
]);

export const notifikasiJenisEnum = pgEnum('notifikasi_jenis', [
  'PBG_JATUH_TEMPO_H_MIN_3',
  'PBG_JATUH_TEMPO_HARI_H',
  'MANUAL',
]);
