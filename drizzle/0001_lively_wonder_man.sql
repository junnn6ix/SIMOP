ALTER TYPE "public"."tiket_status" ADD VALUE 'MAINTENANCE' BEFORE 'DITOLAK';--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "diarsipkan_pada" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jadwal" DROP COLUMN "laporan_teks";--> statement-breakpoint
ALTER TABLE "tiket" DROP COLUMN "tanggal_pinjam";--> statement-breakpoint
ALTER TABLE "tiket" DROP COLUMN "tanggal_kembali";--> statement-breakpoint
ALTER TABLE "tiket" DROP COLUMN "tanggal_selesai";--> statement-breakpoint
ALTER TABLE "public"."tiket" ALTER COLUMN "jenis" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tiket_jenis";--> statement-breakpoint
CREATE TYPE "public"."tiket_jenis" AS ENUM('PERMINTAAN_BARANG', 'LAPOR_KERUSAKAN');--> statement-breakpoint
ALTER TABLE "public"."tiket" ALTER COLUMN "jenis" SET DATA TYPE "public"."tiket_jenis" USING "jenis"::"public"."tiket_jenis";