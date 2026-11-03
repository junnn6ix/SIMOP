'use client';

import * as React from 'react';
import { CheckSquare, Calendar, MapPin, Building, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/dates';
import { VerifikasiItem } from './VerifikasiDialog';

export interface VerifikasiCardProps {
  item: VerifikasiItem;
  onReview: (item: VerifikasiItem) => void;
}

export function VerifikasiCard({ item, onReview }: VerifikasiCardProps) {
  return (
    <div className="p-4 rounded-panel border border-border bg-surface hover:border-text-neutral transition-colors flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-text-primary text-base">
              {item.judul}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-text-primary">
                {item.pegawaiName}
              </span>
              <span className="text-xs text-text-secondary">
                @{item.pegawaiUsername || '-'}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-text-secondary">
                {item.pegawaiBidang}
              </span>
            </div>
          </div>

          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-pill bg-warning-tint text-warning-contrast border border-warning/30 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Menunggu Review</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateShort(item.tanggalMulai)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.lokasiTipe === 'DALAM_KANTOR' ? (
              <>
                <Building className="h-3.5 w-3.5" />
                <span>Dalam Kantor</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Luar Kantor</span>
              </>
            )}
            {item.alamatLokasi && <span>• {item.alamatLokasi}</span>}
          </div>
        </div>

        {item.laporanTeks && (
          <p className="text-xs text-text-secondary bg-muted/40 p-2.5 rounded-btn line-clamp-2">
            &ldquo;{item.laporanTeks}&rdquo;
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-text-secondary">
          Dikirim: {formatDateShort(item.updatedAt)}
        </span>

        <Button
          size="sm"
          onClick={() => onReview(item)}
          className="gap-1.5"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Tinjau Laporan</span>
        </Button>
      </div>
    </div>
  );
}

