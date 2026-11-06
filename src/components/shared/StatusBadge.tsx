import * as React from 'react';
import { cn } from '@/lib/cn';

export type SimopStatus =
  // Jadwal
  | 'BELUM_DIKERJAKAN'
  | 'MENUNGGU_VERIFIKASI'
  | 'SELESAI'
  // PBG
  | 'BELUM_BAYAR'
  | 'LUNAS'
  // Tiket
  | 'MENUNGGU'
  | 'ACC'
  | 'MAINTENANCE'
  | 'DITOLAK'
  // Pegawai / Umum
  | 'AKTIF'
  | 'NONAKTIF'
  // Log notifikasi
  | 'TERKIRIM'
  | 'GAGAL'
  | 'DRY_RUN'
  // Kategori atau tipe
  | string;

export interface StatusBadgeProps {
  status: SimopStatus;
  label?: string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'error' | 'neutral';

function getStatusTone(status: string): Tone {
  const normalized = status.toUpperCase().trim();

  switch (normalized) {
    case 'SELESAI':
    case 'LUNAS':
    case 'ACC':
    case 'AKTIF':
    case 'TERKIRIM':
      return 'success';

    case 'MENUNGGU':
    case 'MENUNGGU_VERIFIKASI':
    case 'PENDING':
    case 'REMINDER_H3':
      return 'warning';

    case 'DITOLAK':
    case 'TERLAMBAT':
    case 'GAGAL':
    case 'NONAKTIF':
    case 'BELUM_BAYAR':
      return 'error';

    case 'BELUM_DIKERJAKAN':
    case 'MAINTENANCE':
    case 'DRY_RUN':
    default:
      return 'neutral';
  }
}

function formatStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'BELUM_DIKERJAKAN':
      return 'Belum Dikerjakan';
    case 'MENUNGGU_VERIFIKASI':
      return 'Menunggu Verifikasi';
    case 'SELESAI':
      return 'Selesai';
    case 'BELUM_BAYAR':
      return 'Belum Bayar';
    case 'LUNAS':
      return 'Lunas';
    case 'MENUNGGU':
      return 'Menunggu';
    case 'ACC':
      return 'Disetujui (ACC)';
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'DITOLAK':
      return 'Ditolak';
    case 'AKTIF':
      return 'Aktif';
    case 'NONAKTIF':
      return 'Nonaktif';
    case 'TERKIRIM':
      return 'Terkirim';
    case 'GAGAL':
      return 'Gagal';
    case 'DRY_RUN':
      return 'Dry Run';
    case 'PENDING':
      return 'Memproses';
    default:
      return status.replace(/_/g, ' ');
  }
}

const toneStyles: Record<Tone, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-success-tint text-success-dark border-success/30',
    dot: 'bg-success',
  },
  warning: {
    badge: 'bg-warning-tint text-warning-dark border-warning/30',
    dot: 'bg-warning',
  },
  error: {
    badge: 'bg-error-tint text-error-dark border-error/30',
    dot: 'bg-error',
  },
  neutral: {
    badge: 'bg-neutral-tint text-neutral-dark border-border',
    dot: 'bg-text-secondary',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const tone = getStatusTone(status);
  const style = toneStyles[tone];
  const displayLabel = label || formatStatusLabel(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold select-none leading-none tracking-tight',
        style.badge,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

