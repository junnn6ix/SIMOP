import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getVerifikasiQueue } from '@/modules/verifikasi/queries';
import { VerifikasiQueue } from '@/modules/verifikasi/components/VerifikasiQueue';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verifikasi Laporan Tugas - SIMOP DPMPTSP',
  description: 'Antrean verifikasi laporan pelaksanaan tugas pegawai dinas.',
};

export default async function AdminVerifikasiPage() {
  await requireRole(['ADMIN']);
  const queueItems = await getVerifikasiQueue();

  return (
    <PageContainer>
      <PageHeader
        title="Antrean Verifikasi Laporan"
        description="Periksa dan setujui (ACC) bukti foto lapangan serta dokumen pendukung dari laporan tugas pegawai."
      />
      <div className="mt-6">
        <VerifikasiQueue initialItems={queueItems} />
      </div>
    </PageContainer>
  );
}

