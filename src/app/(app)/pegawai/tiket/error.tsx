'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function PegawaiTiketError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Tiket Layanan"
        description="Terjadi kendala saat mengambil riwayat tiket layanan Anda. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

