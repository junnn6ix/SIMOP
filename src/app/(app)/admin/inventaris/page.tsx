import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getBarangList, getStokLogHistory } from '@/modules/inventaris/queries';
import { getTiketAdminList } from '@/modules/tiket/queries';
import { InventarisTabs } from '@/modules/inventaris/components/InventarisTabs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inventaris & Tiket Layanan - SIMOP DPMPTSP',
  description: 'Pengelolaan aset, persediaan ATK, mutasi stok, dan tiket permohonan layanan.',
};

export default async function AdminInventarisPage() {
  await requireRole(['ADMIN']);

  const [barangList, stokLogList, tiketList] = await Promise.all([
    getBarangList(),
    getStokLogHistory(),
    getTiketAdminList(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Inventaris & Tiket Layanan"
        description="Kelola katalog barang ATK/aset dinas, pantau mutasi persediaan, dan proses tiket permohonan pegawai."
      />
      <div className="mt-6">
        <InventarisTabs
          barangList={barangList}
          stokLogList={stokLogList}
          tiketList={tiketList}
        />
      </div>
    </PageContainer>
  );
}

