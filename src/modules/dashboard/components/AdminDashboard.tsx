'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  AlertTriangle,
  ReceiptText,
  Building,
  MapPin,
  ArrowRight,
  Store,
  Layers,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { CardGroup } from '@/components/shared/CardGroup';
import { Card } from '@/components/shared/Card';
import { DonutChart } from '@/components/shared/DonutChart';
import { AdminDashboardPanels } from './AdminDashboardPanels';
import { AdminDashboardData } from '../queries';

interface AdminDashboardProps {
  data: AdminDashboardData;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const { totalPegawai, penugasanHariIni, alerts } = data;

  const donutSegments = [
    {
      label: 'Kantor Dinas',
      value: penugasanHariIni.kantor,
      color: 'var(--color-chart-3)',
    },
    {
      label: 'Loket Pelayanan',
      value: penugasanHariIni.loket,
      color: 'var(--color-chart-1)',
    },
    {
      label: 'Layanan Kecamatan',
      value: penugasanHariIni.kecamatan,
      color: 'var(--color-chart-2)',
    },
    {
      label: 'Lainnya / Lapangan',
      value: penugasanHariIni.lainnya,
      color: 'var(--color-chart-4)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row (Format modern: label atas, angka besar, badge kanan atas, ikon muted) */}
      <CardGroup columns={4}>
        <StatCard
          label="Pegawai Aktif"
          value={totalPegawai}
          badge="Aparatur"
          icon={<Users className="h-4 w-4" />}
          description="Aparatur dinas terdaftar"
        />
        <StatCard
          label="Bertugas Hari Ini"
          value={penugasanHariIni.pegawaiUnik}
          badge="Hari Ini"
          icon={<Calendar className="h-4 w-4" />}
          description={`${penugasanHariIni.total} tugas (${penugasanHariIni.kantor} kantor, ${penugasanHariIni.loket} loket, ${penugasanHariIni.kecamatan} kec, ${penugasanHariIni.lainnya} lainnya)`}
        />
        <StatCard
          label="Tiket Menunggu"
          value={alerts.tiketMenunggu}
          badge={alerts.tiketMenunggu > 0 ? `${alerts.tiketMenunggu} Menunggu` : 'Nihil'}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Permintaan & perbaikan ATK"
        />
        <StatCard
          label="PBG Jatuh Tempo"
          value={alerts.pbgDueSoon.count}
          badge={alerts.pbgDueSoon.count > 0 ? '≤ 3 Hari' : 'Aman'}
          icon={<ReceiptText className="h-4 w-4" />}
          description="Tagihan mendekati tempo"
        />
      </CardGroup>

      {/* 2. Middle Row: Donut Chart Distribusi Tugas (Kiri) & Dua Kartu Panel (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart Distribusi Penugasan Hari Ini */}
        <Card className="p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display font-bold text-text-primary text-sm">
                Distribusi Penugasan
              </h3>
              <span className="text-2xs font-mono text-text-secondary uppercase">
                Hari Ini
              </span>
            </div>
            <div className="py-5 flex justify-center">
              {penugasanHariIni.total === 0 ? (
                <div className="py-8 text-center text-xs text-text-secondary">
                  <Calendar className="mx-auto h-8 w-8 text-text-neutral mb-2 opacity-50" />
                  Belum ada penugasan terjadwal untuk hari ini.
                </div>
              ) : (
                <DonutChart
                  segments={donutSegments}
                  size={155}
                  strokeWidth={13}
                  centerLabel="Total Tugas"
                  centerValue={penugasanHariIni.total}
                />
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 truncate">
              <Building className="h-3.5 w-3.5 text-chart-3 shrink-0" /> {penugasanHariIni.kantor} Kantor
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <Store className="h-3.5 w-3.5 text-chart-1 shrink-0" /> {penugasanHariIni.loket} Loket
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-chart-2 shrink-0" /> {penugasanHariIni.kecamatan} Kecamatan
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="h-3.5 w-3.5 text-chart-4 shrink-0" /> {penugasanHariIni.lainnya} Lainnya
            </span>
          </div>
        </Card>

        {/* Dua Kartu Panel: Antrean Verifikasi & Stok Menipis */}
        <AdminDashboardPanels alerts={alerts} />
      </div>

      {/* 3. Bottom Row: Quick Navigation Cards dengan Ikon Berlatar Muted */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <Link href="/admin/jadwal" className="group">
          <Card variant="interactive" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-btn bg-muted border border-border text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">Kelola Jadwal Pegawai</p>
                <p className="text-2xs text-text-secondary truncate">Penugasan kalender dinas & wilayah</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-text-secondary group-hover:text-text-primary transition-colors shrink-0 ml-2" />
          </Card>
        </Link>

        <Link href="/admin/pegawai" className="group">
          <Card variant="interactive" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-btn bg-muted border border-border text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">Manajemen Aparatur</p>
                <p className="text-2xs text-text-secondary truncate">Akun, bidang kedinasan, & status</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-text-secondary group-hover:text-text-primary transition-colors shrink-0 ml-2" />
          </Card>
        </Link>

        <Link href="/admin/pbg" className="group">
          <Card variant="interactive" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-btn bg-muted border border-border text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">Monitoring Retribusi</p>
                <p className="text-2xs text-text-secondary truncate">SKRD & pelunasan PBG Karawang</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-text-secondary group-hover:text-text-primary transition-colors shrink-0 ml-2" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
