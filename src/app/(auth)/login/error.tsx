'use client';

import { ErrorState } from '@/components/shared/ErrorState';

export default function LoginError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Gagal Memuat Halaman Masuk"
      description="Terjadi kendala saat memuat halaman masuk. Silakan coba kembali."
      onRetry={() => reset()}
    />
  );
}

