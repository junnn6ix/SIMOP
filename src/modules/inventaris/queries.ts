import { desc, eq, and, or, ilike, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { barang, stokLog } from '@/db/schema/domain';
import { user } from '@/db/schema/auth';

export interface BarangFilterParams {
  search?: string;
  kategori?: string;
  includeArchived?: boolean;
}

export async function getBarangList(filters: BarangFilterParams = {}) {
  const conditions = [];

  if (!filters.includeArchived) {
    conditions.push(isNull(barang.diarsipkanPada));
  }

  if (filters.kategori && filters.kategori !== 'ALL') {
    conditions.push(eq(barang.kategori, filters.kategori as any));
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(barang.nama, term),
        ilike(barang.kodeBarang, term),
        ilike(barang.deskripsi, term)
      )
    );
  }

  const items = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      kodeBarang: barang.kodeBarang,
      kategori: barang.kategori,
      stok: barang.stok,
      limitStok: barang.limitStok,
      satuan: barang.satuan,
      deskripsi: barang.deskripsi,
      fotoUrl: barang.fotoUrl,
      diarsipkanPada: barang.diarsipkanPada,
      createdAt: barang.createdAt,
      updatedAt: barang.updatedAt,
    })
    .from(barang)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(barang.createdAt));

  return items;
}

export async function getBarangById(id: string) {
  const [item] = await db
    .select()
    .from(barang)
    .where(eq(barang.id, id))
    .limit(1);

  return item || null;
}

export async function getActiveBarangOptions() {
  const items = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      kodeBarang: barang.kodeBarang,
      kategori: barang.kategori,
      stok: barang.stok,
      limitStok: barang.limitStok,
      satuan: barang.satuan,
    })
    .from(barang)
    .where(isNull(barang.diarsipkanPada))
    .orderBy(barang.nama);

  return items;
}

export async function getStokLogHistory(params: {
  limit?: number;
  offset?: number;
  barangId?: string;
} = {}) {
  const { limit = 100, offset = 0, barangId } = params;
  const conditions = [];

  if (barangId) {
    conditions.push(eq(stokLog.barangId, barangId));
  }

  const items = await db
    .select({
      id: stokLog.id,
      barangId: stokLog.barangId,
      barangNama: barang.nama,
      barangKode: barang.kodeBarang,
      barangSatuan: barang.satuan,
      tipe: stokLog.tipe,
      jumlah: stokLog.jumlah,
      stokSebelum: stokLog.stokSebelum,
      stokSesudah: stokLog.stokSesudah,
      keterangan: stokLog.keterangan,
      tiketId: stokLog.tiketId,
      userId: stokLog.userId,
      userName: user.name,
      createdAt: stokLog.createdAt,
    })
    .from(stokLog)
    .innerJoin(barang, eq(stokLog.barangId, barang.id))
    .innerJoin(user, eq(stokLog.userId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stokLog.createdAt))
    .limit(limit)
    .offset(offset);

  return items;
}

