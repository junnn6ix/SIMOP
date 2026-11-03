import { Metadata } from 'next';
import { Users, Calendar, Package, ReceiptText } from 'lucide-react';
import { getServerSession } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { CardGroup } from '@/components/shared/CardGroup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard SIMOP DPMPTSP',
  description: 'Panel kendali operasional dinas.',
};

export default async function DashboardPage() {
  const sessionData = await getServerSession();
  const role = sessionData?.user?.role || 'PEGAWAI';
  const name = sessionData?.user?.name || 'Pengguna';
  const bidang = (sessionData?.user as any)?.bidang || '';

  return (
    <PageContainer>
      <PageHeader
        title={`Selamat Datang, ${name}`}
        description={`SIMOP DPMPTSP Kabupaten Karawang \u2022 Bidang ${bidang} (${role})`}
      />
      <div className="mt-6">
        <CardGroup columns={4}>
          <StatCard
            label="Tugas & Jadwal"
            value="0"
            icon={<Calendar className="h-5 w-5" />}
            description="Jadwal aktif dinas"
          />
          {role === 'ADMIN' && (
            <StatCard
              label="Total Pegawai"
              value="3"
              icon={<Users className="h-5 w-5" />}
              description="Pegawai terdaftar aktif"
            />
          )}
          <StatCard
            label="Inventaris"
            value="4"
            icon={<Package className="h-5 w-5" />}
            description="Item ATK & Aset dinas"
          />
          {role === 'ADMIN' && (
            <StatCard
              label="Monitoring PBG"
              value="0"
              icon={<ReceiptText className="h-5 w-5" />}
              description="Retribusi berjalan"
            />
          )}
        </CardGroup>
      </div>
    </PageContainer>
  );
}

