ALTER TABLE "barang" ADD COLUMN IF NOT EXISTS "limit_stok" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "jadwal" ALTER COLUMN "lokasi_tipe" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."jadwal" ALTER COLUMN "lokasi_tipe" SET DATA TYPE text;--> statement-breakpoint
UPDATE "public"."jadwal" SET "lokasi_tipe" = CASE
  WHEN "lokasi_tipe" = 'DALAM_KANTOR' THEN 'KANTOR'
  WHEN "lokasi_tipe" = 'LUAR_KANTOR' THEN 'LAINNYA'
  ELSE 'KANTOR'
END;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."lokasi_tipe";--> statement-breakpoint
CREATE TYPE "public"."lokasi_tipe" AS ENUM('LOKET', 'KECAMATAN', 'KANTOR', 'LAINNYA');--> statement-breakpoint
ALTER TABLE "public"."jadwal" ALTER COLUMN "lokasi_tipe" SET DATA TYPE "public"."lokasi_tipe" USING "lokasi_tipe"::"public"."lokasi_tipe";--> statement-breakpoint
ALTER TABLE "jadwal" ALTER COLUMN "lokasi_tipe" SET DEFAULT 'KANTOR';
