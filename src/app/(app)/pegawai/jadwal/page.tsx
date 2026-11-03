import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getJadwalPegawaiList } from '@/modules/jadwal/queries';
import { JadwalPegawaiTimeline } from '@/modules/jadwal/components/JadwalPegawaiTimeline';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Jadwal Penugasan Saya - SIMOP DPMPTSP',
  description: 'Daftar penugasan dinas, jadwal piket, dan status pelaporan tugas.',
};

export default async function PegawaiJadwalPage() {
  const { user } = await requireRole(['PEGAWAI', 'ADMIN']);
  const jadwalList = await getJadwalPegawaiList(user.id);

  return (
    <PageContainer>
      <PageHeader
        title="Jadwal Penugasan Saya"
        description="Pantau penugasan dinas Anda, laporkan bukti kegiatan lapangan, dan pantau status verifikasi."
      />
      <div className="mt-6">
        <JadwalPegawaiTimeline initialItems={jadwalList} />
      </div>
    </PageContainer>
  );
}

