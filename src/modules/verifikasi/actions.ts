'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { db } from '@/db';
import { jadwal } from '@/db/schema/domain';
import { validateStatusTransition } from '@/modules/jadwal/lib/generator';
import { verifikasiActionSchema, VerifikasiActionInput } from './schema';

/**
 * Server action untuk verifikasi laporan pelaksanaan tugas oleh Admin.
 * Keputusan ACC mengubah status menjadi SELESAI.
 * Keputusan TOLAK mengembalikan status menjadi BELUM_DIKERJAKAN dengan catatan revisi wajib.
 */
export async function verifikasiJadwalAction(input: VerifikasiActionInput) {
  const { user: verifikator } = await requireRole(['ADMIN']);

  const parsed = verifikasiActionSchema.parse(input);

  const [target] = await db
    .select()
    .from(jadwal)
    .where(eq(jadwal.id, parsed.jadwalId))
    .limit(1);

  if (!target) {
    throw new Error('Jadwal penugasan tidak ditemukan.');
  }

  if (target.status !== 'MENUNGGU_VERIFIKASI') {
    throw new Error('Hanya tugas berstatus MENUNGGU_VERIFIKASI yang dapat diverifikasi.');
  }

  if (parsed.decision === 'ACC') {
    validateStatusTransition({
      currentStatus: target.status,
      targetStatus: 'SELESAI',
    });

    await db
      .update(jadwal)
      .set({
        status: 'SELESAI',
        diverifikasiOlehId: verifikator.id,
        diverifikasiPada: new Date(),
        catatanVerifikator: null,
        updatedAt: new Date(),
      })
      .where(eq(jadwal.id, target.id));

    revalidatePath('/admin/verifikasi');
    revalidatePath('/admin/jadwal');
    revalidatePath('/pegawai/jadwal');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Laporan tugas berhasil disetujui (ACC).',
    };
  } else {
    // TOLAK: Wajib ada catatan
    validateStatusTransition({
      currentStatus: target.status,
      targetStatus: 'BELUM_DIKERJAKAN',
      catatanVerifikator: parsed.catatanVerifikator,
    });

    await db
      .update(jadwal)
      .set({
        status: 'BELUM_DIKERJAKAN',
        diverifikasiOlehId: verifikator.id,
        diverifikasiPada: new Date(),
        catatanVerifikator: parsed.catatanVerifikator,
        updatedAt: new Date(),
      })
      .where(eq(jadwal.id, target.id));

    revalidatePath('/admin/verifikasi');
    revalidatePath('/admin/jadwal');
    revalidatePath('/pegawai/jadwal');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Laporan tugas ditolak dan dikembalikan ke pegawai pelaksana.',
    };
  }
}
