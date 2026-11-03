import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { DevButtonsSection } from './components/DevButtonsSection';
import { DevBadgesSection } from './components/DevBadgesSection';
import { DevFormsSection } from './components/DevFormsSection';
import { DevCardsSection } from './components/DevCardsSection';
import { DevTableSection } from './components/DevTableSection';
import { DevDataVisualsSection } from './components/DevDataVisualsSection';
import { DevFeedbackModalsSection } from './components/DevFeedbackModalsSection';

export const metadata: Metadata = {
  title: 'Galeri Komponen & Genesis Design System',
  description: 'Katalog interaktif seluruh komponen UI, Layout, dan Shared SIMOP DPMPTSP.',
};

export const dynamic = 'force-dynamic';

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const dummyUser = {
    name: 'Admin DPMPTSP Karawang',
    username: 'admin.karawang',
    role: 'ADMIN' as const,
    bidang: 'SEKRETARIAT',
  };

  return (
    <AppShell user={dummyUser}>
      <PageContainer>
        <PageHeader
          title="Galeri Komponen (Genesis Design System)"
          description="Dokumentasi hidup seluruh komponen ui, layout, dan shared yang diimplementasikan sesuai Genesis (docs/DESIGN.md)."
        />

        <div className="space-y-12">
          <DevButtonsSection />
          <DevBadgesSection />
          <DevFormsSection />
          <DevCardsSection />
          <DevTableSection />
          <DevDataVisualsSection />
          <DevFeedbackModalsSection />
        </div>
      </PageContainer>
    </AppShell>
  );
}

