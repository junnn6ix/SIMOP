ALTER TABLE "pbg" DROP CONSTRAINT IF EXISTS "pbg_nomor_pbg_unique";
--> statement-breakpoint
ALTER TABLE "pbg" RENAME COLUMN "nomor_pbg" TO "no_skrd";
--> statement-breakpoint
ALTER TABLE "pbg" RENAME COLUMN "nama_pemohon" TO "pemohon";
--> statement-breakpoint
ALTER TABLE "pbg" RENAME COLUMN "alamat_proyek" TO "lokasi";
--> statement-breakpoint
ALTER TABLE "pbg" RENAME COLUMN "nilai_retribusi" TO "nominal";
--> statement-breakpoint
ALTER TABLE "pbg" ALTER COLUMN "nominal" TYPE numeric(14, 2);
--> statement-breakpoint
ALTER TABLE "pbg" RENAME COLUMN "wa_pemohon" TO "no_wa";
--> statement-breakpoint
ALTER TABLE "pbg" ALTER COLUMN "jatuh_tempo" TYPE date USING jatuh_tempo::date;
--> statement-breakpoint
ALTER TABLE "pbg" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "pbg" ALTER COLUMN "status" TYPE text;
--> statement-breakpoint
DROP TYPE IF EXISTS "pbg_status";
--> statement-breakpoint
CREATE TYPE "pbg_status" AS ENUM('BELUM_BAYAR', 'LUNAS');
--> statement-breakpoint
ALTER TABLE "pbg" ALTER COLUMN "status" TYPE "pbg_status" USING (
  CASE
    WHEN status = 'LUNAS' THEN 'LUNAS'::"pbg_status"
    ELSE 'BELUM_BAYAR'::"pbg_status"
  END
);
--> statement-breakpoint
ALTER TABLE "pbg" ALTER COLUMN "status" SET DEFAULT 'BELUM_BAYAR';
--> statement-breakpoint
ALTER TABLE "pbg" ADD COLUMN IF NOT EXISTS "dibayar_pada" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "pbg" ADD CONSTRAINT "pbg_no_skrd_unique" UNIQUE("no_skrd");
