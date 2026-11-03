'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql, and } from 'drizzle-orm';
import { requireAuth, requireRole } from '@/lib/session';
import { db } from '@/db';
import { tiket, barang, stokLog } from '@/db/schema/domain';
import { toWibDateString } from '@/lib/dates';
import { validateTiketTransition } from './lib/transitions';
import {
  createTiketSchema,
  updateTiketStatusSchema,
  CreateTiketInput,
  UpdateTiketStatusInput,
} from './schema';

/**
 * Server action untuk pegawai mengajukan tiket layanan barang/aset.
 */
export async function createTiketAction(input: CreateTiketInput) {
  const { user } = await requireAuth();

  const parsed = createTiketSchema.parse(input);

  // Verifikasi barang ada dan tidak diarsipkan
  const [targetBarang] = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      kategori: barang.kategori,
      diarsipkanPada: barang.diarsipkanPada,
    })
    .from(barang)
    .where(eq(barang.id, parsed.barangId))
    .limit(1);

  if (!targetBarang) {
    throw new Error('Barang yang dipilih tidak ditemukan.');
  }

  if (targetBarang.diarsipkanPada) {
    throw new Error('Barang ini telah diarsipkan dan tidak dapat diajukan tiket.');
  }

  // Generate nomor tiket format TKT-YYYYMMDD-XXXX
  const datePart = toWibDateString(new Date()).replace(/-/g, '');
  const randomPart = crypto.randomUUID().slice(0, 4).toUpperCase();
  const nomorTiket = `TKT-${datePart}-${randomPart}`;

  await db.insert(tiket).values({
    id: crypto.randomUUID(),
    nomorTiket,
    pemohonId: user.id,
    barangId: parsed.barangId,
    jenis: parsed.jenis,
    jumlah: parsed.jumlah,
    keperluan: parsed.keperluan,
    status: 'MENUNGGU',
  });

  revalidatePath('/pegawai/tiket');
  revalidatePath('/admin/inventaris');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Tiket layanan #${nomorTiket} berhasil diajukan.`,
  };
}

/**
 * Server action untuk Admin menyetujui (ACC) tiket layanan.
 * Langkah pertama dalam transaksi WAJIB mengklaim transisi tiket secara atomik:
 * UPDATE tiket SET status='ACC' ... WHERE id=? AND status='MENUNGGU' RETURNING *;
 * Jika 0 baris terpengaruh, batalkan transaksi (mencegah double ACC).
 *
 * Pada PERMINTAAN_BARANG, pemotongan stok dilakukan secara atomik:
 * UPDATE barang SET stok = stok - jumlah WHERE id = ? AND stok >= jumlah;
 * Jika 0 baris terpengaruh, transaksi dibatalkan dengan pesan "stok tidak mencukupi".
 */
export async function accTiketAction(params: { tiketId: string; catatanAdmin?: string | null }) {
  const { user: admin } = await requireRole(['ADMIN']);
  const { tiketId, catatanAdmin } = params;

  const result = await db.transaction(async (tx) => {
    // 1. Langkah Pertama: Klaim tiket menjadi ACC secara atomik
    const claimed = await tx
      .update(tiket)
      .set({
        status: 'ACC',
        catatanAdmin: catatanAdmin?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(tiket.id, tiketId), eq(tiket.status, 'MENUNGGU')))
      .returning({
        id: tiket.id,
        nomorTiket: tiket.nomorTiket,
        barangId: tiket.barangId,
        jenis: tiket.jenis,
        jumlah: tiket.jumlah,
      });

    if (claimed.length === 0) {
      throw new Error(
        'Tiket tidak dapat disetujui: tiket tidak ditemukan atau sudah tidak berstatus MENUNGGU.'
      );
    }

    const targetTiket = claimed[0];

    // 2. Jika jenis adalah PERMINTAAN_BARANG dan memiliki barangId, potong stok secara atomik
    if (targetTiket.jenis === 'PERMINTAAN_BARANG' && targetTiket.barangId) {
      // Eksekusi update atomik dengan klausul stok >= targetTiket.jumlah langsung dengan RETURNING stok
      const updated = await tx
        .update(barang)
        .set({
          stok: sql`${barang.stok} - ${targetTiket.jumlah}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(barang.id, targetTiket.barangId),
            sql`${barang.stok} >= ${targetTiket.jumlah}`
          )
        )
        .returning({ id: barang.id, stok: barang.stok });

      if (updated.length === 0) {
        throw new Error(
          `Stok barang tidak mencukupi untuk memenuhi permintaan tiket #${targetTiket.nomorTiket}.`
        );
      }

      const stokSesudah = updated[0].stok;
      const stokSebelum = stokSesudah + targetTiket.jumlah;

      // 3. Catat stok_log KELUAR lengkap dengan stokSebelum & stokSesudah
      await tx.insert(stokLog).values({
        id: crypto.randomUUID(),
        barangId: targetTiket.barangId,
        tipe: 'KELUAR',
        jumlah: targetTiket.jumlah,
        stokSebelum,
        stokSesudah,
        keterangan: `Persetujuan Tiket #${targetTiket.nomorTiket}`,
        tiketId: targetTiket.id,
        userId: admin.id,
      });
    }

    return {
      nomorTiket: targetTiket.nomorTiket,
    };
  });

  revalidatePath('/admin/inventaris');
  revalidatePath('/pegawai/tiket');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Tiket #${result.nomorTiket} berhasil disetujui (ACC).`,
  };
}

/**
 * Server action untuk memperbarui status tiket secara umum (Tolak, Maintenance, Selesai).
 */
export async function updateTiketStatusAction(input: UpdateTiketStatusInput) {
  await requireRole(['ADMIN']);

  const parsed = updateTiketStatusSchema.parse(input);

  // Jika status adalah ACC, arahkan ke accTiketAction untuk atomic claiming & stock cut
  if (parsed.status === 'ACC') {
    return await accTiketAction({
      tiketId: parsed.tiketId,
      catatanAdmin: parsed.catatanAdmin,
    });
  }

  const [target] = await db
    .select({
      id: tiket.id,
      nomorTiket: tiket.nomorTiket,
      status: tiket.status,
      jenis: tiket.jenis,
    })
    .from(tiket)
    .where(eq(tiket.id, parsed.tiketId))
    .limit(1);

  if (!target) {
    throw new Error('Tiket tidak ditemukan.');
  }

  // Validasi transisi status melalui fungsi murni domain
  validateTiketTransition(target.status, parsed.status, target.jenis);

  await db
    .update(tiket)
    .set({
      status: parsed.status,
      catatanAdmin: parsed.catatanAdmin?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(tiket.id, parsed.tiketId));

  revalidatePath('/admin/inventaris');
  revalidatePath('/pegawai/tiket');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Status tiket #${target.nomorTiket} berhasil diubah menjadi ${parsed.status}.`,
  };
}
