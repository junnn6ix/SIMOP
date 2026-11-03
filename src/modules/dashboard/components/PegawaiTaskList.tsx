import * as React from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Building,
  Store,
  MapPin,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/dates';
import { PegawaiDashboardData } from '../queries';

interface PegawaiTaskListProps {
  tugasMingguIni: PegawaiDashboardData['tugasMingguIni'];
}

export function PegawaiTaskList({ tugasMingguIni }: PegawaiTaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-text-primary text-base">
            Jadwal Penugasan Minggu Ini
          </h3>
          <p className="text-xs text-text-secondary">
            Daftar kegiatan kedinasan yang ditugaskan kepada Anda pada minggu berjalan
          </p>
        </div>
        <Link
          href="/pegawai/jadwal"
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          Lihat Semua Jadwal <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {tugasMingguIni.length === 0 ? (
        <Card className="p-10 text-center">
          <Calendar className="mx-auto h-8 w-8 text-text-neutral opacity-50 mb-2" />
          <p className="text-sm font-semibold text-text-primary">
            Tidak ada tugas yang dijadwalkan minggu ini.
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Nikmati pekan Anda atau koordinasikan dengan administrator dinas.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tugasMingguIni.map((item) => (
            <Card
              key={item.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-text-secondary">
                    {formatDateShort(item.tanggal)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-text-primary font-display truncate">
                  {item.judul}
                </h4>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    {item.lokasiTipe === 'KANTOR' && (
                      <>
                        <Building className="h-3.5 w-3.5 text-chart-3" /> Kantor Dinas
                      </>
                    )}
                    {item.lokasiTipe === 'LOKET' && (
                      <>
                        <Store className="h-3.5 w-3.5 text-chart-1" /> Loket Pelayanan
                      </>
                    )}
                    {item.lokasiTipe === 'KECAMATAN' && (
                      <>
                        <MapPin className="h-3.5 w-3.5 text-chart-2" /> Kecamatan: {item.alamatLokasi || 'Sesuai Arahan'}
                      </>
                    )}
                    {item.lokasiTipe === 'LAINNYA' && (
                      <>
                        <Layers className="h-3.5 w-3.5 text-chart-4" /> Lapangan / Lainnya: {item.alamatLokasi || 'Sesuai Arahan'}
                      </>
                    )}
                  </span>
                </div>
                {item.catatanVerifikator && (
                  <div className="text-xs text-error bg-error-tint p-2 rounded-btn mt-2 border border-error/20 flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Catatan Verifikator: {item.catatanVerifikator}</span>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {item.status === 'BELUM_DIKERJAKAN' && (
                  <Link href="/pegawai/jadwal">
                    <Button variant="primary" size="sm" className="h-8 text-xs">
                      Kirim Laporan
                    </Button>
                  </Link>
                )}
                {item.status === 'MENUNGGU_VERIFIKASI' && (
                  <span className="text-xs text-text-secondary italic">
                    Sedang Ditinjau Admin
                  </span>
                )}
                {item.status === 'SELESAI' && (
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Tugas Selesai
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

