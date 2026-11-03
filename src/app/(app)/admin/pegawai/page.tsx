import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getPegawaiList } from '@/modules/pegawai/queries';
import { PegawaiTable } from '@/modules/pegawai/components/PegawaiTable';
import { PegawaiHeaderActions } from '@/modules/pegawai/components/PegawaiHeaderActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manajemen Pegawai - SIMOP DPMPTSP',
  description: 'Pengelolaan akun, wewenang akses, dan data pegawai dinas.',
};

export default async function AdminPegawaiPage() {
  await requireRole(['ADMIN']);
  const pegawaiList = await getPegawaiList();

  return (
    <PageContainer>
      <PageHeader
        title="Manajemen Pegawai"
        description="Kelola akun, penugasan bidang dinas, dan status akses pegawai SIMOP DPMPTSP."
        actions={<PegawaiHeaderActions />}
      />
      <div className="mt-6">
        <PegawaiTable data={pegawaiList} />
      </div>
    </PageContainer>
  );
}
