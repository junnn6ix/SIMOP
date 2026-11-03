import { desc, eq, and, or, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { jadwal } from '@/db/schema/domain';
import { user } from '@/db/schema/auth';

export interface JadwalFilterParams {
  pegawaiId?: string;
  status?: string;
  lokasiTipe?: string;
  search?: string;
}

export async function getJadwalAdminList(filters: JadwalFilterParams = {}) {
  const conditions = [];

  if (filters.pegawaiId && filters.pegawaiId !== 'ALL') {
    conditions.push(eq(jadwal.pegawaiId, filters.pegawaiId));
  }

  if (filters.status && filters.status !== 'ALL') {
    conditions.push(eq(jadwal.status, filters.status as any));
  }

  if (filters.lokasiTipe && filters.lokasiTipe !== 'ALL') {
    conditions.push(eq(jadwal.lokasiTipe, filters.lokasiTipe as any));
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(jadwal.judul, term),
        ilike(jadwal.alamatLokasi, term),
        ilike(user.name, term)
      )
    );
  }

  const query = db
    .select({
      id: jadwal.id,
      judul: jadwal.judul,
      deskripsi: jadwal.deskripsi,
      tanggal: jadwal.tanggal,
      pegawaiId: jadwal.pegawaiId,
      pegawaiName: user.name,
      pegawaiUsername: user.username,
      pegawaiBidang: user.bidang,
      lokasiTipe: jadwal.lokasiTipe,
      alamatLokasi: jadwal.alamatLokasi,
      status: jadwal.status,
      catatanVerifikator: jadwal.catatanVerifikator,
      buktiKey: jadwal.buktiKey,
      pdfKey: jadwal.pdfKey,
      diverifikasiOlehId: jadwal.diverifikasiOlehId,
      diverifikasiPada: jadwal.diverifikasiPada,
      createdAt: jadwal.createdAt,
    })
    .from(jadwal)
    .innerJoin(user, eq(jadwal.pegawaiId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jadwal.tanggal), desc(jadwal.createdAt));

  return await query;
}

export async function getJadwalPegawaiList(pegawaiId: string, statusFilter?: string) {
  const conditions = [eq(jadwal.pegawaiId, pegawaiId)];

  if (statusFilter && statusFilter !== 'ALL') {
    conditions.push(eq(jadwal.status, statusFilter as any));
  }

  const items = await db
    .select({
      id: jadwal.id,
      judul: jadwal.judul,
      deskripsi: jadwal.deskripsi,
      tanggal: jadwal.tanggal,
      lokasiTipe: jadwal.lokasiTipe,
      alamatLokasi: jadwal.alamatLokasi,
      status: jadwal.status,
      catatanVerifikator: jadwal.catatanVerifikator,
      buktiKey: jadwal.buktiKey,
      pdfKey: jadwal.pdfKey,
      diverifikasiPada: jadwal.diverifikasiPada,
      createdAt: jadwal.createdAt,
    })
    .from(jadwal)
    .where(and(...conditions))
    .orderBy(desc(jadwal.tanggal), desc(jadwal.createdAt));

  return items;
}

export async function getJadwalById(id: string) {
  const [item] = await db
    .select({
      id: jadwal.id,
      judul: jadwal.judul,
      deskripsi: jadwal.deskripsi,
      tanggal: jadwal.tanggal,
      pegawaiId: jadwal.pegawaiId,
      pegawaiName: user.name,
      pegawaiUsername: user.username,
      pegawaiBidang: user.bidang,
      lokasiTipe: jadwal.lokasiTipe,
      alamatLokasi: jadwal.alamatLokasi,
      status: jadwal.status,
      catatanVerifikator: jadwal.catatanVerifikator,
      buktiKey: jadwal.buktiKey,
      pdfKey: jadwal.pdfKey,
      diverifikasiOlehId: jadwal.diverifikasiOlehId,
      diverifikasiPada: jadwal.diverifikasiPada,
      createdAt: jadwal.createdAt,
      updatedAt: jadwal.updatedAt,
    })
    .from(jadwal)
    .innerJoin(user, eq(jadwal.pegawaiId, user.id))
    .where(eq(jadwal.id, id))
    .limit(1);

  return item || null;
}

export async function getActivePegawaiOptions() {
  return await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      bidang: user.bidang,
    })
    .from(user)
    .where(and(eq(user.role, 'PEGAWAI'), eq(user.aktif, true)))
    .orderBy(user.name);
}
