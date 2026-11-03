'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql, and } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { db } from '@/db';
import { barang, stokLog, tiket } from '@/db/schema/domain';
import {
  createBarangSchema,
  updateBarangSchema,
  adjustStokSchema,
  CreateBarangInput,
  UpdateBarangInput,
  AdjustStokInput,
} from './schema';

/**
 * Server action untuk mendaftarkan barang inventaris baru.
 * Kode barang digenerate otomatis jika tidak diisi manual.
 */
export async function createBarangAction(input: CreateBarangInput) {
  const { user: admin } = await requireRole(['ADMIN']);

  const parsed = createBarangSchema.parse(input);
  const barangId = crypto.randomUUID();
  const kodeBarang =
    parsed.kodeBarang && parsed.kodeBarang.trim()
      ? parsed.kodeBarang.trim().toUpperCase()
      : `BRG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  await db.transaction(async (tx) => {
    // 1. Simpan barang baru
    await tx.insert(barang).values({
      id: barangId,
      nama: parsed.nama,
      kodeBarang,
      kategori: parsed.kategori,
      stok: parsed.stok,
      limitStok: parsed.limitStok,
      satuan: parsed.satuan || 'Pcs',
      deskripsi: parsed.deskripsi || null,
      fotoUrl: parsed.fotoUrl || null,
    });

    // 2. Jika ada stok awal, catat log mutasi MASUK
    if (parsed.stok > 0) {
      await tx.insert(stokLog).values({
        id: crypto.randomUUID(),
        barangId,
        tipe: 'MASUK',
        jumlah: parsed.stok,
        stokSebelum: 0,
        stokSesudah: parsed.stok,
        keterangan: 'Pencatatan stok awal barang baru',
        userId: admin.id,
      });
    }
  });

  revalidatePath('/admin/inventaris');
  return { success: true, message: `Barang "${parsed.nama}" berhasil ditambahkan.` };
}

/**
 * Server action untuk memperbarui informasi barang.
 */
export async function updateBarangAction(input: UpdateBarangInput) {
  await requireRole(['ADMIN']);

  const parsed = updateBarangSchema.parse(input);

  await db
    .update(barang)
    .set({
      nama: parsed.nama,
      kategori: parsed.kategori,
      limitStok: parsed.limitStok,
      satuan: parsed.satuan,
      deskripsi: parsed.deskripsi || null,
      fotoUrl: parsed.fotoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(barang.id, parsed.id));

  revalidatePath('/admin/inventaris');
  return { success: true, message: 'Data barang berhasil diperbarui.' };
}

/**
 * Server action untuk penyesuaian stok (MASUK atau KELUAR).
 * Menjamin stok tidak boleh bernilai negatif secara atomik dalam transaksi database.
 */
export async function adjustStokAction(input: AdjustStokInput) {
  const { user: admin } = await requireRole(['ADMIN']);

  const parsed = adjustStokSchema.parse(input);

  const result = await db.transaction(async (tx) => {
    // Ambil data barang terkini dengan lock transaksi
    const [target] = await tx
      .select({
        id: barang.id,
        nama: barang.nama,
        stok: barang.stok,
      })
      .from(barang)
      .where(eq(barang.id, parsed.barangId))
      .limit(1);

    if (!target) {
      throw new Error('Barang tidak ditemukan.');
    }

    const stokSebelum = target.stok;
    let stokSesudah: number;

    if (parsed.tipe === 'MASUK') {
      stokSesudah = stokSebelum + parsed.jumlah;
      await tx
        .update(barang)
        .set({
          stok: sql`${barang.stok} + ${parsed.jumlah}`,
          updatedAt: new Date(),
        })
        .where(eq(barang.id, target.id));
    } else {
      // Tipe KELUAR: pastikan stok >= jumlah mutasi
      if (stokSebelum < parsed.jumlah) {
        throw new Error(
          `Stok saat ini (${stokSebelum}) tidak mencukupi untuk pengurangan sebanyak ${parsed.jumlah}.`
        );
      }

      stokSesudah = stokSebelum - parsed.jumlah;

      const updated = await tx
        .update(barang)
        .set({
          stok: sql`${barang.stok} - ${parsed.jumlah}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(barang.id, target.id),
            sql`${barang.stok} >= ${parsed.jumlah}`
          )
        )
        .returning({ id: barang.id });

      if (updated.length === 0) {
        throw new Error('Stok barang tidak mencukupi untuk pengurangan ini.');
      }
    }

    // Catat ke stok_log
    await tx.insert(stokLog).values({
      id: crypto.randomUUID(),
      barangId: target.id,
      tipe: parsed.tipe,
      jumlah: parsed.jumlah,
      stokSebelum,
      stokSesudah,
      keterangan: parsed.keterangan,
      userId: admin.id,
    });

    return {
      nama: target.nama,
      stokSebelum,
      stokSesudah,
    };
  });

  revalidatePath('/admin/inventaris');
  return {
    success: true,
    message: `Penyesuaian stok "${result.nama}" berhasil (${result.stokSebelum} ➔ ${result.stokSesudah}).`,
  };
}

/**
 * Server action untuk menghapus atau mengarsipkan barang.
 * Jika barang memiliki riwayat tiket atau log mutasi stok, barang diarsipkan (soft-archive).
 * Jika tidak memiliki riwayat sama sekali, barang dihapus permanen dari basis data.
 */
export async function deleteOrArchiveBarangAction(id: string) {
  await requireRole(['ADMIN']);

  const result = await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ id: barang.id, nama: barang.nama })
      .from(barang)
      .where(eq(barang.id, id))
      .limit(1);

    if (!target) {
      throw new Error('Barang tidak ditemukan.');
    }

    // Cek keberadaan tiket terkait
    const [hasTiket] = await tx
      .select({ id: tiket.id })
      .from(tiket)
      .where(eq(tiket.barangId, id))
      .limit(1);

    // Cek keberadaan log stok terkait
    const [hasLog] = await tx
      .select({ id: stokLog.id })
      .from(stokLog)
      .where(eq(stokLog.barangId, id))
      .limit(1);

    if (hasTiket || hasLog) {
      // Arsipkan barang
      await tx
        .update(barang)
        .set({
          diarsipkanPada: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(barang.id, id));

      return {
        archived: true,
        message: `Barang "${target.nama}" memiliki riwayat transaksi/tiket sehingga berhasil diarsipkan.`,
      };
    } else {
      // Hapus permanen
      await tx.delete(barang).where(eq(barang.id, id));

      return {
        archived: false,
        message: `Barang "${target.nama}" berhasil dihapus secara permanen.`,
      };
    }
  });

  revalidatePath('/admin/inventaris');
  return { success: true, ...result };
}

/**
 * Server action untuk memulihkan barang yang sebelumnya diarsipkan.
 */
export async function restoreBarangAction(id: string) {
  await requireRole(['ADMIN']);

  const [target] = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      diarsipkanPada: barang.diarsipkanPada,
    })
    .from(barang)
    .where(eq(barang.id, id))
    .limit(1);

  if (!target) {
    throw new Error('Barang tidak ditemukan.');
  }

  if (!target.diarsipkanPada) {
    throw new Error('Barang ini berstatus aktif dan tidak sedang diarsipkan.');
  }

  await db
    .update(barang)
    .set({
      diarsipkanPada: null,
      updatedAt: new Date(),
    })
    .where(eq(barang.id, id));

  revalidatePath('/admin/inventaris');
  return {
    success: true,
    message: `Barang "${target.nama}" berhasil dipulihkan dari arsip.`,
  };
}

