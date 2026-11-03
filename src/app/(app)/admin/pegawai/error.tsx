'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorState } from '@/components/shared/ErrorState';

export default function AdminPegawaiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Gagal Memuat Data Pegawai"
        description="Terjadi kendala saat mengambil daftar akun pegawai. Silakan coba kembali."
        onRetry={reset}
      />
    </PageContainer>
  );
}

