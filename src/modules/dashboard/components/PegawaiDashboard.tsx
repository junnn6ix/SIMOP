'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Ticket,
  FileCheck,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { CardGroup } from '@/components/shared/CardGroup';
import { StatCard } from '@/components/shared/StatCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/dates';
import { PegawaiTaskList } from './PegawaiTaskList';
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
    <div className="space-y-6">
      {/* 1. Header Banner & Action Shortcuts */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-card border border-border bg-surface">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider font-sans">
            Portal Pegawai
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-text-primary mt-0.5">
            Selamat Datang, {userName}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Bidang {userBidang || 'Pelayanan'} &bull; Periode Minggu Ini ({formatDateShort(weekRange.mondayDateStr)} - {formatDateShort(weekRange.sundayDateStr)})
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/pegawai/jadwal">
            <Button variant="primary" size="sm" className="gap-2 text-xs font-semibold">
              <FileCheck className="h-4 w-4" />
              Kirim Laporan
            </Button>
          </Link>
          <Link href="/pegawai/tiket">
            <Button variant="secondary" size="sm" className="gap-2 text-xs font-semibold">
              <Ticket className="h-4 w-4" />
              Ajukan Tiket
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary: Progres Tugas Minggu Ini & Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <Card className="p-5 lg:col-span-1 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left pb-3 border-b border-border">
            <h3 className="font-display font-bold text-text-primary text-sm">
              Progres Minggu Ini
            </h3>
            <p className="text-2xs text-text-secondary">Penyelesaian penugasan kedinasan</p>
          </div>

          <div className="py-5 flex flex-col items-center">
            <ProgressRing
              value={progressPersen}
              size={135}
              strokeWidth={13}
              label={`${progressPersen}%`}
              sublabel="Tuntas"
            />
            <p className="text-xs text-text-secondary mt-3">
              <strong className="text-text-primary">{selesai}</strong> dari {totalTugas} tugas telah selesai
            </p>
          </div>

          <div className="w-full pt-3 border-t border-border flex items-center justify-between text-2xs text-text-secondary">
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
              badge="Mingguan"
              icon={<Calendar className="h-4 w-4" />}
              description="Jadwal dinas Anda minggu ini"
            />
            <StatCard
              label="Tugas Selesai"
              value={selesai}
              badge="Tuntas"
              icon={<CheckCircle2 className="h-4 w-4 text-success" />}
              description="Telah diverifikasi admin"
            />
            <StatCard
              label="Menunggu Verifikasi"
              value={menungguVerifikasi}
              badge="Review"
              icon={<Clock className="h-4 w-4 text-warning" />}
              description="Laporan sudah dikirimkan"
            />
            <StatCard
              label="Tiket Layanan Aktif"
              value={tiketAktifCount}
              badge="Layanan"
              icon={<Ticket className="h-4 w-4" />}
              description="Tiket ATK sedang diproses"
            />
          </CardGroup>
        </div>
      </div>

      {/* 3. Daftar Tugas Minggu Ini */}
      <PegawaiTaskList tugasMingguIni={tugasMingguIni} />
    </div>
  );
}
