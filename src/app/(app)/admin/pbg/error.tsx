'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function AdminPbgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Data Retribusi PBG"
        description="Terjadi kendala saat mengambil data ketetapan retribusi PBG. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

