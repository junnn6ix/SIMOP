CREATE TYPE "public"."barang_kategori" AS ENUM('ATK', 'ASET');--> statement-breakpoint
CREATE TYPE "public"."bidang" AS ENUM('SEKRETARIAT', 'PTSP', 'PM', 'PENGAWASAN');--> statement-breakpoint
CREATE TYPE "public"."jadwal_status" AS ENUM('BELUM_DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'SELESAI', 'DITOLAK');--> statement-breakpoint
CREATE TYPE "public"."lokasi_tipe" AS ENUM('DALAM_KANTOR', 'LUAR_KANTOR');--> statement-breakpoint
CREATE TYPE "public"."notifikasi_jenis" AS ENUM('PBG_JATUH_TEMPO_H_MIN_3', 'PBG_JATUH_TEMPO_HARI_H');--> statement-breakpoint
CREATE TYPE "public"."notifikasi_status" AS ENUM('TERKIRIM', 'GAGAL');--> statement-breakpoint
CREATE TYPE "public"."pbg_status" AS ENUM('BELUM_LUNAS', 'LUNAS', 'KADALUARSA');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'PEGAWAI');--> statement-breakpoint
CREATE TYPE "public"."stok_tipe" AS ENUM('MASUK', 'KELUAR', 'PENYESUAIAN');--> statement-breakpoint
CREATE TYPE "public"."tiket_jenis" AS ENUM('PERMINTAAN_ATK', 'PEMINJAMAN_ASET', 'PERBAIKAN_ASET');--> statement-breakpoint
CREATE TYPE "public"."tiket_status" AS ENUM('MENUNGGU', 'ACC', 'DITOLAK', 'SELESAI');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	"role" "role" DEFAULT 'PEGAWAI' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"nip" text,
	"bidang" "bidang" NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barang" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"kode_barang" text NOT NULL,
	"kategori" "barang_kategori" NOT NULL,
	"stok" integer DEFAULT 0 NOT NULL,
	"satuan" text DEFAULT 'Pcs',
	"deskripsi" text,
	"foto_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "barang_kode_barang_unique" UNIQUE("kode_barang"),
	CONSTRAINT "barang_stok_non_negative" CHECK ("barang"."stok" >= 0)
);
--> statement-breakpoint
CREATE TABLE "jadwal" (
	"id" text PRIMARY KEY NOT NULL,
	"judul" text NOT NULL,
	"deskripsi" text,
	"tanggal_mulai" timestamp with time zone NOT NULL,
	"tanggal_selesai" timestamp with time zone NOT NULL,
	"pegawai_id" text NOT NULL,
	"lokasi_tipe" "lokasi_tipe" DEFAULT 'DALAM_KANTOR' NOT NULL,
	"alamat_lokasi" text,
	"status" "jadwal_status" DEFAULT 'BELUM_DIKERJAKAN' NOT NULL,
	"laporan_teks" text,
	"catatan_verifikator" text,
	"bukti_key" text,
	"pdf_key" text,
	"diverifikasi_oleh_id" text,
	"diverifikasi_pada" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifikasi_log" (
	"id" text PRIMARY KEY NOT NULL,
	"pbg_id" text NOT NULL,
	"jenis" "notifikasi_jenis" NOT NULL,
	"jatuh_tempo_snapshot" timestamp with time zone NOT NULL,
	"status" "notifikasi_status" DEFAULT 'TERKIRIM' NOT NULL,
	"pesan" text NOT NULL,
	"wa_tujuan" text NOT NULL,
	"respons" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_pbg_notifikasi" UNIQUE("pbg_id","jenis","jatuh_tempo_snapshot")
);
--> statement-breakpoint
CREATE TABLE "pbg" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_pbg" text NOT NULL,
	"nama_pemohon" text NOT NULL,
	"alamat_proyek" text NOT NULL,
	"nilai_retribusi" numeric(15, 2) NOT NULL,
	"jatuh_tempo" timestamp with time zone NOT NULL,
	"status" "pbg_status" DEFAULT 'BELUM_LUNAS' NOT NULL,
	"wa_pemohon" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pbg_nomor_pbg_unique" UNIQUE("nomor_pbg")
);
--> statement-breakpoint
CREATE TABLE "pengaturan" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stok_log" (
	"id" text PRIMARY KEY NOT NULL,
	"barang_id" text NOT NULL,
	"tipe" "stok_tipe" NOT NULL,
	"jumlah" integer NOT NULL,
	"stok_sebelum" integer NOT NULL,
	"stok_sesudah" integer NOT NULL,
	"keterangan" text NOT NULL,
	"tiket_id" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiket" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_tiket" text NOT NULL,
	"pemohon_id" text NOT NULL,
	"barang_id" text NOT NULL,
	"jenis" "tiket_jenis" NOT NULL,
	"jumlah" integer DEFAULT 1 NOT NULL,
	"keperluan" text NOT NULL,
	"status" "tiket_status" DEFAULT 'MENUNGGU' NOT NULL,
	"tanggal_pinjam" timestamp with time zone,
	"tanggal_kembali" timestamp with time zone,
	"tanggal_selesai" timestamp with time zone,
	"catatan_admin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tiket_nomor_tiket_unique" UNIQUE("nomor_tiket")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_pegawai_id_users_id_fk" FOREIGN KEY ("pegawai_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_diverifikasi_oleh_id_users_id_fk" FOREIGN KEY ("diverifikasi_oleh_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi_log" ADD CONSTRAINT "notifikasi_log_pbg_id_pbg_id_fk" FOREIGN KEY ("pbg_id") REFERENCES "public"."pbg"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stok_log" ADD CONSTRAINT "stok_log_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stok_log" ADD CONSTRAINT "stok_log_tiket_id_tiket_id_fk" FOREIGN KEY ("tiket_id") REFERENCES "public"."tiket"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stok_log" ADD CONSTRAINT "stok_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket" ADD CONSTRAINT "tiket_pemohon_id_users_id_fk" FOREIGN KEY ("pemohon_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket" ADD CONSTRAINT "tiket_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE restrict ON UPDATE no action;