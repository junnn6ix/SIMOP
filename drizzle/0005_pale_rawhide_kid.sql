ALTER TYPE "public"."notifikasi_jenis" ADD VALUE IF NOT EXISTS 'MANUAL';--> statement-breakpoint
ALTER TYPE "public"."notifikasi_status" ADD VALUE IF NOT EXISTS 'DRY_RUN';--> statement-breakpoint
ALTER TYPE "public"."notifikasi_status" ADD VALUE IF NOT EXISTS 'PENDING';
