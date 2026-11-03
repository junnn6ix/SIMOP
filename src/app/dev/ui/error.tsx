'use client';

import * as React from 'react';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageContainer } from '@/components/layout/PageContainer';

export default function DevUiError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Galeri Komponen"
        description="Terjadi kesalahan saat memuat komponen antarmuka. Silakan coba lagi."
        onRetry={() => reset()}
      />
    </PageContainer>
  );
}

