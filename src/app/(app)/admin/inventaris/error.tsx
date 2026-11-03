'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function AdminInventarisError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Data Inventaris"
        description="Terjadi kendala saat mengambil data inventaris dan tiket layanan. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

