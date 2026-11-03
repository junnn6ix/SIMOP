import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { jadwal } from '@/db/schema/domain';
import { user } from '@/db/schema/auth';

export async function getVerifikasiQueue() {
  const items = await db
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
      updatedAt: jadwal.updatedAt,
      createdAt: jadwal.createdAt,
    })
    .from(jadwal)
    .innerJoin(user, eq(jadwal.pegawaiId, user.id))
    .where(eq(jadwal.status, 'MENUNGGU_VERIFIKASI'))
    .orderBy(desc(jadwal.updatedAt));

  return items;
}
