import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  check,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';
import {
  lokasiTipeEnum,
  jadwalStatusEnum,
  barangKategoriEnum,
  tiketJenisEnum,
  tiketStatusEnum,
  stokTipeEnum,
  pbgStatusEnum,
  notifikasiStatusEnum,
  notifikasiJenisEnum,
} from './enums';

export const jadwal = pgTable('jadwal', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi'),
  tanggalMulai: timestamp('tanggal_mulai', { withTimezone: true }).notNull(),
  tanggalSelesai: timestamp('tanggal_selesai', { withTimezone: true }).notNull(),
  pegawaiId: text('pegawai_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lokasiTipe: lokasiTipeEnum('lokasi_tipe').notNull().default('DALAM_KANTOR'),
  alamatLokasi: text('alamat_lokasi'),
  status: jadwalStatusEnum('status').notNull().default('BELUM_DIKERJAKAN'),
  laporanTeks: text('laporan_teks'),
  catatanVerifikator: text('catatan_verifikator'),
  buktiKey: text('bukti_key'),
  pdfKey: text('pdf_key'),
  diverifikasiOlehId: text('diverifikasi_oleh_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  diverifikasiPada: timestamp('diverifikasi_pada', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const barang = pgTable(
  'barang',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nama: text('nama').notNull(),
    kodeBarang: text('kode_barang')
      .notNull()
      .unique()
      .$defaultFn(() => `BRG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`),
    kategori: barangKategoriEnum('kategori').notNull(),
    stok: integer('stok').notNull().default(0),
    satuan: text('satuan').default('Pcs'),
    deskripsi: text('deskripsi'),
    fotoUrl: text('foto_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('barang_stok_non_negative', sql`${table.stok} >= 0`),
  ]
);

export const tiket = pgTable('tiket', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nomorTiket: text('nomor_tiket').notNull().unique(),
  pemohonId: text('pemohon_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  barangId: text('barang_id')
    .notNull()
    .references(() => barang.id, { onDelete: 'restrict' }),
  jenis: tiketJenisEnum('jenis').notNull(),
  jumlah: integer('jumlah').notNull().default(1),
  keperluan: text('keperluan').notNull(),
  status: tiketStatusEnum('status').notNull().default('MENUNGGU'),
  tanggalPinjam: timestamp('tanggal_pinjam', { withTimezone: true }),
  tanggalKembali: timestamp('tanggal_kembali', { withTimezone: true }),
  tanggalSelesai: timestamp('tanggal_selesai', { withTimezone: true }),
  catatanAdmin: text('catatan_admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stokLog = pgTable('stok_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  barangId: text('barang_id')
    .notNull()
    .references(() => barang.id, { onDelete: 'cascade' }),
  tipe: stokTipeEnum('tipe').notNull(),
  jumlah: integer('jumlah').notNull(),
  stokSebelum: integer('stok_sebelum').notNull(),
  stokSesudah: integer('stok_sesudah').notNull(),
  keterangan: text('keterangan').notNull(),
  tiketId: text('tiket_id').references(() => tiket.id, {
    onDelete: 'set null',
  }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pbg = pgTable('pbg', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nomorPbg: text('nomor_pbg').notNull().unique(),
  namaPemohon: text('nama_pemohon').notNull(),
  alamatProyek: text('alamat_proyek').notNull(),
  nilaiRetribusi: numeric('nilai_retribusi', { precision: 15, scale: 2 }).notNull(),
  jatuhTempo: timestamp('jatuh_tempo', { withTimezone: true }).notNull(),
  status: pbgStatusEnum('status').notNull().default('BELUM_LUNAS'),
  waPemohon: text('wa_pemohon').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifikasiLog = pgTable(
  'notifikasi_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pbgId: text('pbg_id')
      .notNull()
      .references(() => pbg.id, { onDelete: 'cascade' }),
    jenis: notifikasiJenisEnum('jenis').notNull(),
    jatuhTempoSnapshot: timestamp('jatuh_tempo_snapshot', {
      withTimezone: true,
    }).notNull(),
    status: notifikasiStatusEnum('status').notNull().default('TERKIRIM'),
    pesan: text('pesan').notNull(),
    waTujuan: text('wa_tujuan').notNull(),
    respons: text('respons'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('unique_pbg_notifikasi').on(
      table.pbgId,
      table.jenis,
      table.jatuhTempoSnapshot
    ),
  ]
);

export const pengaturan = pgTable('pengaturan', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
