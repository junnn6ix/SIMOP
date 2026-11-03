'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function AdminVerifikasiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Antrean Verifikasi"
        description="Terjadi kendala saat mengambil antrean verifikasi laporan tugas. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

