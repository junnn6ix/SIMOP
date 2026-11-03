import { Metadata } from 'next';
import { requireAuth } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAdminDashboardStats, getPegawaiDashboardStats } from '@/modules/dashboard/queries';
import { AdminDashboard } from '@/modules/dashboard/components/AdminDashboard';
import { PegawaiDashboard } from '@/modules/dashboard/components/PegawaiDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard SIMOP DPMPTSP',
  description: 'Panel kendali operasional internal dinas DPMPTSP Kabupaten Karawang.',
};

export default async function DashboardPage() {
  const { user: sessionUser } = await requireAuth();
  const isAdmin = sessionUser.role === 'ADMIN';

  const [adminStats, pegawaiStats] = await Promise.all([
    isAdmin ? getAdminDashboardStats() : null,
    !isAdmin ? getPegawaiDashboardStats(sessionUser.id) : null,
  ]);

  return (
    <PageContainer>
      <PageHeader
        title={isAdmin ? 'Pusat Kendali Operasional' : 'Dashboard Tugas Pegawai'}
        description={`SIMOP DPMPTSP Kabupaten Karawang \u2022 Bidang ${sessionUser.bidang || 'Umum'}`}
      />
      <div className="mt-6">
        {isAdmin && adminStats && <AdminDashboard data={adminStats} />}
        {!isAdmin && pegawaiStats && (
          <PegawaiDashboard
            data={pegawaiStats}
            userName={sessionUser.name}
            userBidang={sessionUser.bidang}
          />
        )}
      </div>
    </PageContainer>
  );
}
