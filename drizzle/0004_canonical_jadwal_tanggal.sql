ALTER TABLE "jadwal" ADD COLUMN IF NOT EXISTS "tanggal" date;--> statement-breakpoint
UPDATE "jadwal" SET "tanggal" = ("tanggal_mulai" AT TIME ZONE 'Asia/Jakarta')::date WHERE "tanggal" IS NULL;--> statement-breakpoint
ALTER TABLE "jadwal" ALTER COLUMN "tanggal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jadwal" DROP COLUMN IF EXISTS "tanggal_mulai";--> statement-breakpoint
ALTER TABLE "jadwal" DROP COLUMN IF EXISTS "tanggal_selesai";

