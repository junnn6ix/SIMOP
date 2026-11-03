'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { db } from '@/db';
import { jadwal } from '@/db/schema/domain';
import {
  createPresignedUploadUrl,
  verifyR2Object,
  deleteR2Object,
  ALLOWED_FOTO_MIMES,
  ALLOWED_PDF_MIMES,
} from '@/lib/storage';
import { generateJadwalRange, validateStatusTransition } from './lib/generator';
import {
  createJadwalRangeSchema,
  submitLaporanSchema,
  CreateJadwalRangeInput,
  SubmitLaporanInput,
} from './schema';

/**
 * Server action untuk membuat jadwal tugas rentang tanggal untuk satu atau banyak pegawai.
 * Akses terbatas untuk ADMIN.
 */
export async function createJadwalRangeAction(input: CreateJadwalRangeInput) {
  await requireRole(['ADMIN']);

  const parsed = createJadwalRangeSchema.parse(input);

  const items = generateJadwalRange({
    judul: parsed.judul,
    deskripsi: parsed.deskripsi || undefined,
    tanggalMulai: parsed.tanggalMulai,
    tanggalSelesai: parsed.tanggalSelesai,
    pegawaiIds: parsed.pegawaiIds,
    lokasiTipe: parsed.lokasiTipe,
    alamatLokasi: parsed.alamatLokasi || undefined,
    skipWeekends: parsed.skipWeekends,
  });

  if (items.length === 0) {
    throw new Error('Tidak ada jadwal tugas yang dihasilkan pada rentang tanggal yang dipilih.');
  }

  // Insert batch ke database Drizzle
  await db.insert(jadwal).values(
    items.map((item) => ({
      id: item.id,
      judul: item.judul,
      deskripsi: item.deskripsi,
      tanggalMulai: item.tanggalMulai,
      tanggalSelesai: item.tanggalSelesai,
      pegawaiId: item.pegawaiId,
      lokasiTipe: item.lokasiTipe,
      alamatLokasi: item.alamatLokasi,
      status: item.status,
    }))
  );

  revalidatePath('/admin/jadwal');
  revalidatePath('/dashboard');

  return {
    success: true,
    count: items.length,
    message: `Berhasil membuat ${items.length} penugasan jadwal.`,
  };
}

/**
 * Server action untuk menghapus jadwal tugas.
 * Membersihkan objek R2 terkait jika berkas pernah diunggah.
 * Akses terbatas untuk ADMIN.
 */
export async function deleteJadwalAction(id: string) {
  await requireRole(['ADMIN']);

  const [existing] = await db
    .select({
      id: jadwal.id,
      buktiKey: jadwal.buktiKey,
      pdfKey: jadwal.pdfKey,
    })
    .from(jadwal)
    .where(eq(jadwal.id, id))
    .limit(1);

  if (!existing) {
    throw new Error('Jadwal tugas tidak ditemukan.');
  }

  // Hapus berkas R2 jika ada
  if (existing.buktiKey) {
    await deleteR2Object(existing.buktiKey);
  }
  if (existing.pdfKey) {
    await deleteR2Object(existing.pdfKey);
  }

  await db.delete(jadwal).where(eq(jadwal.id, id));

  revalidatePath('/admin/jadwal');
  revalidatePath('/admin/verifikasi');
  revalidatePath('/pegawai/jadwal');
  revalidatePath('/dashboard');

  return { success: true, message: 'Jadwal tugas berhasil dihapus.' };
}

/**
 * Server action untuk mengirim laporan pelaksanaan tugas oleh pegawai.
 * Memverifikasi hak akses kepemilikan, status transisi, dan integritas berkas di Cloudflare R2.
 */
export async function submitLaporanAction(input: SubmitLaporanInput) {
  const { user: currentUser } = await requireRole(['PEGAWAI', 'ADMIN']);

  const parsed = submitLaporanSchema.parse(input);

  const [target] = await db
    .select()
    .from(jadwal)
    .where(eq(jadwal.id, parsed.jadwalId))
    .limit(1);

  if (!target) {
    throw new Error('Jadwal tugas tidak ditemukan.');
  }

  // Pastikan pemilik tugas yang mengirim laporan (atau admin)
  if (currentUser.role !== 'ADMIN' && target.pegawaiId !== currentUser.id) {
    throw new Error('Anda tidak memiliki wewenang untuk melaporkan jadwal tugas ini.');
  }

  // Validasi transisi status (harus BELUM_DIKERJAKAN -> MENUNGGU_VERIFIKASI)
  validateStatusTransition({
    currentStatus: target.status,
    targetStatus: 'MENUNGGU_VERIFIKASI',
  });

  // Verifikasi bukti foto utama di Cloudflare R2
  await verifyR2Object({
    objectKey: parsed.buktiKey,
    jadwalId: target.id,
    allowedMimes: ALLOWED_FOTO_MIMES,
  });

  // Verifikasi dokumen PDF opsional di Cloudflare R2 jika disertakan
  if (parsed.pdfKey) {
    await verifyR2Object({
      objectKey: parsed.pdfKey,
      jadwalId: target.id,
      allowedMimes: ALLOWED_PDF_MIMES,
    });
  }

  // Jika pegawai upload ulang setelah ditolak, hapus objek lama di R2 untuk menghemat storage
  if (target.buktiKey && target.buktiKey !== parsed.buktiKey) {
    await deleteR2Object(target.buktiKey);
  }
  if (target.pdfKey && parsed.pdfKey && target.pdfKey !== parsed.pdfKey) {
    await deleteR2Object(target.pdfKey);
  }

  // Update status tugas menjadi MENUNGGU_VERIFIKASI
  await db
    .update(jadwal)
    .set({
      buktiKey: parsed.buktiKey,
      pdfKey: parsed.pdfKey || null,
      laporanTeks: parsed.laporanTeks || null,
      status: 'MENUNGGU_VERIFIKASI',
      catatanVerifikator: null, // Reset catatan penolakan sebelumnya jika ada
      updatedAt: new Date(),
    })
    .where(eq(jadwal.id, target.id));

  revalidatePath('/pegawai/jadwal');
  revalidatePath('/admin/jadwal');
  revalidatePath('/admin/verifikasi');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: 'Laporan tugas berhasil dikirim dan menunggu verifikasi verifikator.',
  };
}
