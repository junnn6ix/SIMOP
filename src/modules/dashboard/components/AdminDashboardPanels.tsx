import * as React from 'react';
import Link from 'next/link';
import { CheckSquare, Package, ArrowRight } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/ui/button';
import { AdminDashboardData } from '../queries';

interface AdminDashboardPanelsProps {
  alerts: AdminDashboardData['alerts'];
}

export function AdminDashboardPanels({ alerts }: AdminDashboardPanelsProps) {
  return (
    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Panel 1: Antrean Verifikasi Laporan */}
      <Card className="p-5 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-text-secondary shrink-0" />
              <h3 className="font-display font-bold text-text-primary text-sm">
                Antrean Verifikasi
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-sans font-medium bg-muted text-text-secondary">
                {alerts.jadwalMenunggu.count}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 px-2 text-xs text-text-secondary hover:text-text-primary"
            >
              <Link href="/admin/verifikasi" className="flex items-center gap-1">
                <span>Lihat Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {alerts.jadwalMenunggu.items.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary">
              Semua laporan dinas telah terverifikasi.
            </div>
          ) : (
            <ul className="divide-y divide-border m-0 p-0 list-none">
              {alerts.jadwalMenunggu.items.map((item) => (
                <li
                  key={item.id}
                  className="py-2.5 px-1 flex items-center justify-between gap-2 hover:bg-muted/40 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary truncate leading-tight">
                      {item.judul}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {item.pegawaiName} &bull; {item.tanggal}
                    </p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium uppercase bg-muted text-text-secondary shrink-0">
                    {item.lokasiTipe}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Panel 2: Stok ATK Menipis */}
      <Card className="p-5 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-text-secondary shrink-0" />
              <h3 className="font-display font-bold text-text-primary text-sm">
                Stok ATK Menipis
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-sans font-medium bg-muted text-text-secondary">
                {alerts.stokMenipis.count}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 px-2 text-xs text-text-secondary hover:text-text-primary"
            >
              <Link href="/admin/inventaris" className="flex items-center gap-1">
                <span>Lihat Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {alerts.stokMenipis.items.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary">
              Semua persediaan ATK berada di atas batas minimum.
            </div>
          ) : (
            <ul className="divide-y divide-border m-0 p-0 list-none">
              {alerts.stokMenipis.items.map((item) => (
                <li
                  key={item.id}
                  className="py-2.5 px-1 flex items-center justify-between gap-2 hover:bg-muted/40 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary truncate leading-tight">
                      {item.nama}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      Batas minimum: {item.limitStok} {item.satuan || 'unit'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-sans font-bold tabular-nums bg-error-tint text-error shrink-0">
                    {item.stok} {item.satuan || ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

