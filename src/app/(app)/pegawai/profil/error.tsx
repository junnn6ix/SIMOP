'use client';

import * as React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function ProfilError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Profil"
        description={error.message || 'Terjadi kesalahan sistem saat mengambil profil aparatur.'}
        onRetry={reset}
      />
    </PageContainer>
  );
}

