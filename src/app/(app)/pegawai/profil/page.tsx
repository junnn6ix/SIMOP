import { Metadata } from 'next';
import { requireAuth } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfilView } from '@/modules/profil/components/ProfilView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profil & Keamanan Akun - SIMOP DPMPTSP',
  description: 'Pengaturan identitas kedinasan dan perubahan kata sandi aparatur.',
};

export default async function PegawaiProfilPage() {
  const { user: sessionUser } = await requireAuth();

  return (
    <PageContainer>
      <PageHeader
        title="Profil & Keamanan Akun"
        description="Kelola informasi aparatur dan keamanan kata sandi akun SIMOP DPMPTSP Karawang."
      />
      <div className="mt-6">
        <ProfilView user={sessionUser} />
      </div>
    </PageContainer>
  );
}
