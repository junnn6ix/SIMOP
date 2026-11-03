import { desc, eq, and, or, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { tiket, barang } from '@/db/schema/domain';
import { user } from '@/db/schema/auth';

export interface TiketFilterParams {
  status?: string;
  jenis?: string;
  search?: string;
}

export async function getTiketAdminList(filters: TiketFilterParams = {}) {
  const conditions = [];

  if (filters.status && filters.status !== 'ALL') {
    conditions.push(eq(tiket.status, filters.status as any));
  }

  if (filters.jenis && filters.jenis !== 'ALL') {
    conditions.push(eq(tiket.jenis, filters.jenis as any));
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(tiket.nomorTiket, term),
        ilike(tiket.keperluan, term),
        ilike(barang.nama, term),
        ilike(user.name, term)
      )
    );
  }

  const items = await db
    .select({
      id: tiket.id,
      nomorTiket: tiket.nomorTiket,
      pemohonId: tiket.pemohonId,
      pemohonName: user.name,
      pemohonUsername: user.username,
      pemohonBidang: user.bidang,
      barangId: tiket.barangId,
      barangNama: barang.nama,
      barangKode: barang.kodeBarang,
      barangKategori: barang.kategori,
      barangSatuan: barang.satuan,
      barangStok: barang.stok,
      jenis: tiket.jenis,
      jumlah: tiket.jumlah,
      keperluan: tiket.keperluan,
      status: tiket.status,
      catatanAdmin: tiket.catatanAdmin,
      createdAt: tiket.createdAt,
      updatedAt: tiket.updatedAt,
    })
    .from(tiket)
    .innerJoin(user, eq(tiket.pemohonId, user.id))
    .innerJoin(barang, eq(tiket.barangId, barang.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tiket.createdAt));

  return items;
}

export async function getTiketPegawaiList(userId: string) {
  const items = await db
    .select({
      id: tiket.id,
      nomorTiket: tiket.nomorTiket,
      barangId: tiket.barangId,
      barangNama: barang.nama,
      barangKode: barang.kodeBarang,
      barangKategori: barang.kategori,
      barangSatuan: barang.satuan,
      jenis: tiket.jenis,
      jumlah: tiket.jumlah,
      keperluan: tiket.keperluan,
      status: tiket.status,
      catatanAdmin: tiket.catatanAdmin,
      createdAt: tiket.createdAt,
      updatedAt: tiket.updatedAt,
    })
    .from(tiket)
    .innerJoin(barang, eq(tiket.barangId, barang.id))
    .where(eq(tiket.pemohonId, userId))
    .orderBy(desc(tiket.createdAt));

  return items;
}

export async function getTiketById(id: string) {
  const [item] = await db
    .select({
      id: tiket.id,
      nomorTiket: tiket.nomorTiket,
      pemohonId: tiket.pemohonId,
      pemohonName: user.name,
      pemohonUsername: user.username,
      pemohonBidang: user.bidang,
      barangId: tiket.barangId,
      barangNama: barang.nama,
      barangKode: barang.kodeBarang,
      barangKategori: barang.kategori,
      barangSatuan: barang.satuan,
      barangStok: barang.stok,
      jenis: tiket.jenis,
      jumlah: tiket.jumlah,
      keperluan: tiket.keperluan,
      status: tiket.status,
      catatanAdmin: tiket.catatanAdmin,
      createdAt: tiket.createdAt,
      updatedAt: tiket.updatedAt,
    })
    .from(tiket)
    .innerJoin(user, eq(tiket.pemohonId, user.id))
    .innerJoin(barang, eq(tiket.barangId, barang.id))
    .where(eq(tiket.id, id))
    .limit(1);

  return item || null;
}

