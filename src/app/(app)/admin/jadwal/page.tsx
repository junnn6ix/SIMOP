import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getJadwalAdminList, getActivePegawaiOptions } from '@/modules/jadwal/queries';
import { JadwalAdminTable } from '@/modules/jadwal/components/JadwalAdminTable';
import { JadwalHeaderActions } from '@/modules/jadwal/components/JadwalHeaderActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manajemen Jadwal & Penugasan - SIMOP DPMPTSP',
  description: 'Pengaturan jadwal tugas piket dan penugasan luar dinas pegawai.',
};

export default async function AdminJadwalPage() {
  await requireRole(['ADMIN']);

  const [jadwalList, pegawaiOptions] = await Promise.all([
    getJadwalAdminList(),
    getActivePegawaiOptions(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Jadwal & Penugasan Dinas"
        description="Jadwalkan tugas piket internal, verifikasi lapangan, dan penugasan pegawai DPMPTSP."
        actions={<JadwalHeaderActions pegawaiOptions={pegawaiOptions} />}
      />
      <div className="mt-6">
        <JadwalAdminTable data={jadwalList} />
      </div>
    </PageContainer>
  );
}
