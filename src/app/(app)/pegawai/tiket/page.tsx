import { Metadata } from 'next';
import { requireAuth } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getActiveBarangOptions } from '@/modules/inventaris/queries';
import { getTiketPegawaiList } from '@/modules/tiket/queries';
import { TiketPegawaiList } from '@/modules/tiket/components/TiketPegawaiList';
import { TiketFormDialog } from '@/modules/tiket/components/TiketFormDialog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tiket Layanan Pegawai - SIMOP DPMPTSP',
  description: 'Pengajuan permintaan barang perlengkapan kerja dan pelaporan kerusakan aset kantor.',
};

export default async function PegawaiTiketPage() {
  const { user } = await requireAuth();

  const [tiketList, barangOptions] = await Promise.all([
    getTiketPegawaiList(user.id),
    getActiveBarangOptions(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Tiket Layanan Mandiri"
        description="Ajukan permohonan ATK/barang perlengkapan dinas dan pantau status penanganan laporan kerusakan aset."
        actions={<TiketFormDialog barangOptions={barangOptions} />}
      />
      <div className="mt-6">
        <TiketPegawaiList data={tiketList} />
      </div>
    </PageContainer>
  );
}

