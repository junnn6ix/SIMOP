import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getPbgList } from '@/modules/pbg/queries';
import { PbgTable } from '@/modules/pbg/components/PbgTable';
import { PbgHeaderActions } from '@/modules/pbg/components/PbgHeaderActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monitoring Retribusi PBG - SIMOP DPMPTSP',
  description: 'Pencatatan ketetapan retribusi PBG, status pelunasan SKRD, dan monitoring jatuh tempo.',
};

export default async function AdminPbgPage() {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const pbgList = await getPbgList();

  return (
    <PageContainer>
      <PageHeader
        title="Monitoring Retribusi PBG"
        description="Kelola data ketetapan retribusi Persetujuan Bangunan Gedung (PBG), pantau pelunasan SKRD, dan kontrol jatuh tempo pembayaran."
        actions={<PbgHeaderActions />}
      />
      <div className="mt-6">
        <PbgTable data={pbgList} />
      </div>
    </PageContainer>
  );
}

