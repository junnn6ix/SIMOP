import { Metadata } from 'next';
import { requireRole } from '@/lib/session';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { getPbgList, getNotifikasiLogs } from '@/modules/pbg/queries';
import { getReminderTargets } from '@/modules/pbg/lib/reminder';
import {
  getPengaturan,
  KEY_WA_BOT_AKTIF,
  KEY_WA_TEMPLATE_REMINDER,
  DEFAULT_WA_TEMPLATE_REMINDER,
} from '@/modules/pbg/lib/pengaturan';
import { PbgTabs } from '@/modules/pbg/components/PbgTabs';
import { PbgHeaderActions } from '@/modules/pbg/components/PbgHeaderActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monitoring Retribusi PBG - SIMOP DPMPTSP',
  description: 'Pencatatan ketetapan retribusi PBG, status pelunasan SKRD, dan monitoring jatuh tempo.',
};

export default async function AdminPbgPage() {
  await requireRole(['ADMIN'], { checkDbActive: true });

  const [pbgList, botAktifStr, templateStr, notifikasiLogs, pendingTargets] =
    await Promise.all([
      getPbgList(),
      getPengaturan(KEY_WA_BOT_AKTIF, 'false'),
      getPengaturan(KEY_WA_TEMPLATE_REMINDER, DEFAULT_WA_TEMPLATE_REMINDER),
      getNotifikasiLogs(),
      getReminderTargets({ trigger: 'MANUAL' }),
    ]);

  const botAktif = botAktifStr === 'true';
  const hasFonnteToken = Boolean(process.env.FONNTE_TOKEN?.trim());

  return (
    <PageContainer>
      <PageHeader
        title="Monitoring Retribusi PBG"
        description="Kelola data ketetapan retribusi Persetujuan Bangunan Gedung (PBG), pantau pelunasan SKRD, dan atur otomatisasi pengingat WhatsApp."
        actions={<PbgHeaderActions />}
      />
      <div className="mt-6">
        <PbgTabs
          pbgList={pbgList}
          botAktif={botAktif}
          template={templateStr}
          hasFonnteToken={hasFonnteToken}
          pendingReminderCount={pendingTargets.length}
          notifikasiLogs={notifikasiLogs}
        />
      </div>
    </PageContainer>
  );
}
