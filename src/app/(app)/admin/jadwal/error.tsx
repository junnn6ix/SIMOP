'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function AdminJadwalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Jadwal Penugasan"
        description="Terjadi kendala saat mengambil data jadwal penugasan dinas. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

