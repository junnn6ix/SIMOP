'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function PegawaiJadwalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Jadwal Anda"
        description="Terjadi kendala saat mengambil daftar penugasan dinas Anda. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

