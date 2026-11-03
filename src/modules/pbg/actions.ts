'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, ne } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { db } from '@/db';
import { pbg } from '@/db/schema/domain';
import {
  createPbgSchema,
  updatePbgSchema,
  CreatePbgInput,
  UpdatePbgInput,
} from './schema';

/**
 * Server action untuk mendaftarkan tagihan retribusi PBG baru.
 * Nomor SKRD diverifikasi unik dan nomor WA dinormalisasi ke format 628xxx.
 */
export async function createPbgAction(input: CreatePbgInput) {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const parsed = createPbgSchema.parse(input);

  // Verifikasi keunikan nomor SKRD
  const [existingSkrd] = await db
    .select({ id: pbg.id })
    .from(pbg)
    .where(eq(pbg.noSkrd, parsed.noSkrd))
    .limit(1);

  if (existingSkrd) {
    throw new Error(`Nomor SKRD "${parsed.noSkrd}" sudah terdaftar dalam sistem.`);
  }

  const pbgId = crypto.randomUUID();

  await db.insert(pbg).values({
    id: pbgId,
    pemohon: parsed.pemohon,
    noWa: parsed.noWa,
    noSkrd: parsed.noSkrd,
    lokasi: parsed.lokasi,
    nominal: parsed.nominal.toFixed(2),
    jatuhTempo: parsed.jatuhTempo,
    status: 'BELUM_BAYAR',
  });

  revalidatePath('/admin/pbg');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Tagihan PBG untuk ${parsed.pemohon} (SKRD: ${parsed.noSkrd}) berhasil didaftarkan.`,
  };
}

/**
 * Server action untuk memperbarui informasi tagihan PBG.
 */
export async function updatePbgAction(input: UpdatePbgInput) {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const parsed = updatePbgSchema.parse(input);

  // Verifikasi keunikan SKRD jika nomor diubah
  const [duplicate] = await db
    .select({ id: pbg.id })
    .from(pbg)
    .where(and(eq(pbg.noSkrd, parsed.noSkrd), ne(pbg.id, parsed.id)))
    .limit(1);

  if (duplicate) {
    throw new Error(`Nomor SKRD "${parsed.noSkrd}" sudah digunakan oleh tagihan lain.`);
  }

  await db
    .update(pbg)
    .set({
      pemohon: parsed.pemohon,
      noWa: parsed.noWa,
      noSkrd: parsed.noSkrd,
      lokasi: parsed.lokasi,
      nominal: parsed.nominal.toFixed(2),
      jatuhTempo: parsed.jatuhTempo,
      updatedAt: new Date(),
    })
    .where(eq(pbg.id, parsed.id));

  revalidatePath('/admin/pbg');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Data tagihan SKRD ${parsed.noSkrd} berhasil diperbarui.`,
  };
}

/**
 * Server action untuk menandai status tagihan menjadi LUNAS.
 * Mencatat waktu pelunasan secara presisi pada kolom dibayar_pada.
 */
export async function markPbgLunasAction(id: string) {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const [target] = await db
    .select({
      id: pbg.id,
      pemohon: pbg.pemohon,
      noSkrd: pbg.noSkrd,
      status: pbg.status,
    })
    .from(pbg)
    .where(eq(pbg.id, id))
    .limit(1);

  if (!target) {
    throw new Error('Tagihan PBG tidak ditemukan.');
  }

  if (target.status === 'LUNAS') {
    throw new Error('Tagihan PBG ini sudah berstatus LUNAS.');
  }

  const now = new Date();

  await db
    .update(pbg)
    .set({
      status: 'LUNAS',
      dibayarPada: now,
      updatedAt: now,
    })
    .where(eq(pbg.id, id));

  revalidatePath('/admin/pbg');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Tagihan SKRD ${target.noSkrd} berhasil ditandai LUNAS.`,
  };
}

/**
 * Server action untuk membatalkan status pelunasan (kembali ke BELUM_BAYAR).
 * Mengosongkan kolom dibayar_pada.
 */
export async function unmarkPbgLunasAction(id: string) {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const [target] = await db
    .select({
      id: pbg.id,
      noSkrd: pbg.noSkrd,
      status: pbg.status,
    })
    .from(pbg)
    .where(eq(pbg.id, id))
    .limit(1);

  if (!target) {
    throw new Error('Tagihan PBG tidak ditemukan.');
  }

  await db
    .update(pbg)
    .set({
      status: 'BELUM_BAYAR',
      dibayarPada: null,
      updatedAt: new Date(),
    })
    .where(eq(pbg.id, id));

  revalidatePath('/admin/pbg');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Status pelunasan SKRD ${target.noSkrd} berhasil dibatalkan (kembali ke BELUM BAYAR).`,
  };
}

/**
 * Server action untuk menghapus data tagihan PBG.
 */
export async function deletePbgAction(id: string) {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const [target] = await db
    .select({ id: pbg.id, noSkrd: pbg.noSkrd, pemohon: pbg.pemohon })
    .from(pbg)
    .where(eq(pbg.id, id))
    .limit(1);

  if (!target) {
    throw new Error('Tagihan PBG tidak ditemukan.');
  }

  await db.delete(pbg).where(eq(pbg.id, id));

  revalidatePath('/admin/pbg');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Tagihan SKRD ${target.noSkrd} atas nama ${target.pemohon} berhasil dihapus.`,
  };
}

/**
 * Server action untuk mengambil data lengkap tagihan PBG termasuk nomor WhatsApp utuh
 * (tanpa sensor) saat admin membuka formulir edit.
 */
export async function getPbgFullContactAction(id: string) {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const [target] = await db
    .select({
      id: pbg.id,
      pemohon: pbg.pemohon,
      noWa: pbg.noWa,
      noSkrd: pbg.noSkrd,
      lokasi: pbg.lokasi,
      nominal: pbg.nominal,
      jatuhTempo: pbg.jatuhTempo,
    })
    .from(pbg)
    .where(eq(pbg.id, id))
    .limit(1);

  if (!target) {
    throw new Error('Tagihan PBG tidak ditemukan.');
  }

  return {
    ...target,
    nominal: parseFloat(target.nominal),
  };
}

