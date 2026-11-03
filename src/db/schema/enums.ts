import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'PEGAWAI']);

export const bidangEnum = pgEnum('bidang', [
  'SEKRETARIAT',
  'PTSP',
  'PM',
  'PENGAWASAN',
]);

export const lokasiTipeEnum = pgEnum('lokasi_tipe', [
  'DALAM_KANTOR',
  'LUAR_KANTOR',
]);

export const jadwalStatusEnum = pgEnum('jadwal_status', [
  'BELUM_DIKERJAKAN',
  'MENUNGGU_VERIFIKASI',
  'SELESAI',
  'DITOLAK',
]);

export const barangKategoriEnum = pgEnum('barang_kategori', ['ATK', 'ASET']);

export const tiketJenisEnum = pgEnum('tiket_jenis', [
  'PERMINTAAN_ATK',
  'PEMINJAMAN_ASET',
  'PERBAIKAN_ASET',
]);

export const tiketStatusEnum = pgEnum('tiket_status', [
  'MENUNGGU',
  'ACC',
  'DITOLAK',
  'SELESAI',
]);

export const stokTipeEnum = pgEnum('stok_tipe', [
  'MASUK',
  'KELUAR',
  'PENYESUAIAN',
]);

export const pbgStatusEnum = pgEnum('pbg_status', [
  'BELUM_LUNAS',
  'LUNAS',
  'KADALUARSA',
]);

export const notifikasiStatusEnum = pgEnum('notifikasi_status', [
  'TERKIRIM',
  'GAGAL',
]);

export const notifikasiJenisEnum = pgEnum('notifikasi_jenis', [
  'PBG_JATUH_TEMPO_H_MIN_3',
  'PBG_JATUH_TEMPO_HARI_H',
]);
