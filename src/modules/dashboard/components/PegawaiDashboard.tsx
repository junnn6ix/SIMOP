'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Ticket,
  FileCheck,
  Building,
  Store,
  MapPin,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { CardGroup } from '@/components/shared/CardGroup';
import { StatCard } from '@/components/shared/StatCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/dates';
import { PegawaiDashboardData } from '../queries';

interface PegawaiDashboardProps {
  data: PegawaiDashboardData;
  userName: string;
  userBidang?: string;
}

export function PegawaiDashboard({ data, userName, userBidang }: PegawaiDashboardProps) {
  const {
    weekRange,
    totalTugas,
    selesai,
    menungguVerifikasi,
    belumDikerjakan,
    progressPersen,
    tugasMingguIni,
    tiketAktifCount,
  } = data;

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Action Shortcuts */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-card border border-border bg-surface">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Portal Pegawai
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-text-primary mt-0.5">
            Selamat Datang, {userName}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Bidang {userBidang || 'Pelayanan'} &bull; Periode Minggu Ini ({formatDateShort(weekRange.mondayDateStr)} - {formatDateShort(weekRange.sundayDateStr)})
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/pegawai/jadwal">
            <Button variant="primary" size="sm" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Kirim Laporan
            </Button>
          </Link>
          <Link href="/pegawai/tiket">
            <Button variant="secondary" size="sm" className="gap-2">
              <Ticket className="h-4 w-4" />
              Ajukan Tiket
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary: Progres Tugas Minggu Ini & Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <Card className="p-6 lg:col-span-1 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left pb-3 border-b border-border">
            <h3 className="font-display font-bold text-text-primary text-base">
              Progres Minggu Ini
            </h3>
            <p className="text-xs text-text-secondary">Penyelesaian penugasan kerja</p>
          </div>

          <div className="py-6 flex flex-col items-center">
            <ProgressRing
              value={progressPersen}
              size={140}
              strokeWidth={14}
              label={`${progressPersen}%`}
              sublabel="Tuntas"
            />
            <p className="text-xs text-text-secondary mt-3">
              <strong className="text-text-primary">{selesai}</strong> dari {totalTugas} tugas telah selesai
            </p>
          </div>

          <div className="w-full pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>{belumDikerjakan} Belum Mulai</span>
            <span>{menungguVerifikasi} Menunggu Verifikasi</span>
          </div>
        </Card>

        {/* 4 Stat Cards */}
        <div className="lg:col-span-2">
          <CardGroup columns={2}>
            <StatCard
              label="Total Tugas Minggu Ini"
              value={totalTugas}
              icon={<Calendar className="h-5 w-5" />}
              description="Jadwal dinas Anda minggu ini"
            />
            <StatCard
              label="Tugas Selesai"
              value={selesai}
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              description="Telah diverifikasi admin"
            />
            <StatCard
              label="Menunggu Verifikasi"
              value={menungguVerifikasi}
              icon={<Clock className="h-5 w-5 text-warning" />}
              description="Laporan sudah dikirimkan"
            />
            <StatCard
              label="Tiket Layanan Aktif"
              value={tiketAktifCount}
              icon={<Ticket className="h-5 w-5" />}
              description="Tiket ATK sedang diproses"
            />
          </CardGroup>
        </div>
      </div>

      {/* 3. Daftar Tugas Minggu Ini */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg">
              Jadwal Penugasan Minggu Ini
            </h3>
            <p className="text-xs text-text-secondary">
              Daftar kegiatan kedinasan yang ditugaskan kepada Anda pada minggu berjalan
            </p>
          </div>
          <Link href="/pegawai/jadwal" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            Lihat Semua Jadwal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tugasMingguIni.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-text-neutral opacity-50 mb-3" />
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
              <Card key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-text-secondary">
                      {formatDateShort(item.tanggal)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary font-display">
                    {item.judul}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      {item.lokasiTipe === 'KANTOR' && (
                        <>
                          <Building className="h-3.5 w-3.5 text-primary" /> Kantor Dinas
                        </>
                      )}
                      {item.lokasiTipe === 'LOKET' && (
                        <>
                          <Store className="h-3.5 w-3.5 text-success" /> Loket Pelayanan
                        </>
                      )}
                      {item.lokasiTipe === 'KECAMATAN' && (
                        <>
                          <MapPin className="h-3.5 w-3.5 text-warning" /> Kecamatan: {item.alamatLokasi || 'Sesuai Arahan'}
                        </>
                      )}
                      {item.lokasiTipe === 'LAINNYA' && (
                        <>
                          <Layers className="h-3.5 w-3.5 text-text-secondary" /> Lapangan / Lainnya: {item.alamatLokasi || 'Sesuai Arahan'}
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
                    <Link href={`/pegawai/jadwal`}>
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
    </div>
  );
}
