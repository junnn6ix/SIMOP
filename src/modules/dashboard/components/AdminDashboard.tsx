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
import { AlertCard } from '@/components/shared/AlertCard';
import { DonutChart } from '@/components/shared/DonutChart';
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
    <div className="space-y-8">
      {/* 1. Stat Cards Row */}
      <CardGroup columns={4}>
        <StatCard
          label="Pegawai Aktif"
          value={totalPegawai}
          icon={<Users className="h-5 w-5" />}
          description="Aparatur dinas terdaftar"
        />
        <StatCard
          label="Bertugas Hari Ini"
          value={penugasanHariIni.total}
          icon={<Calendar className="h-5 w-5" />}
          description={`${penugasanHariIni.kantor} kantor, ${penugasanHariIni.loket} loket, ${penugasanHariIni.kecamatan} kec, ${penugasanHariIni.lainnya} lainnya`}
        />
        <StatCard
          label="Tiket Menunggu"
          value={alerts.tiketMenunggu}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Permintaan & perbaikan ATK"
        />
        <StatCard
          label="PBG Jatuh Tempo"
          value={alerts.pbgDueSoon.count}
          icon={<ReceiptText className="h-5 w-5" />}
          description="Tagihan rentang ≤ 3 hari"
        />
      </CardGroup>

      {/* 2. Middle Row: Distribusi Penugasan Hari Ini & Tindakan Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualisasi Donut Chart Penugasan */}
        <Card className="p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display font-bold text-text-primary text-base">
                Distribusi Penugasan
              </h3>
              <span className="text-xs text-text-secondary font-medium">Hari Ini</span>
            </div>
            <div className="py-6 flex justify-center">
              {penugasanHariIni.total === 0 ? (
                <div className="py-8 text-center text-sm text-text-secondary">
                  <Calendar className="mx-auto h-8 w-8 text-text-neutral mb-2 opacity-50" />
                  Belum ada penugasan terjadwal untuk hari ini.
                </div>
              ) : (
                <DonutChart
                  segments={donutSegments}
                  size={150}
                  strokeWidth={16}
                  centerLabel="Total Tugas"
                  centerValue={penugasanHariIni.total}
                />
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-chart-3" /> {penugasanHariIni.kantor} Kantor
            </span>
            <span className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-chart-1" /> {penugasanHariIni.loket} Loket
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-chart-2" /> {penugasanHariIni.kecamatan} Kecamatan
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-chart-4" /> {penugasanHariIni.lainnya} Lainnya
            </span>
          </div>
        </Card>

        {/* Ringkasan Perhatian Administratif (Alerts) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-text-primary text-base">
              Perlu Tindakan Segera
            </h3>
            <span className="text-xs text-text-secondary">
              Status operasional yang memerlukan verifikasi / persetujuan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Alert 1: Jadwal Menunggu Verifikasi */}
            <AlertCard
              title="Verifikasi Laporan"
              description="Laporan dinas pegawai yang telah selesai dikerjakan dan butuh verifikasi admin."
              count={alerts.jadwalMenunggu}
              href="/admin/verifikasi"
              linkText="Buka Verifikasi"
              tone={alerts.jadwalMenunggu > 0 ? 'warning' : 'neutral'}
            />

            {/* Alert 2: Tiket Menunggu ACC */}
            <AlertCard
              title="Tiket Layanan Pending"
              description="Permintaan ATK baru atau laporan kerusakan sarana dari pegawai."
              count={alerts.tiketMenunggu}
              href="/admin/inventaris"
              linkText="Kelola Tiket"
              tone={alerts.tiketMenunggu > 0 ? 'warning' : 'neutral'}
            />

            {/* Alert 3: Stok Menipis */}
            <AlertCard
              title="Stok ATK Menipis"
              description="Item inventaris dengan stok ≤ limit batas minimum yang perlu pengadaan ulang."
              count={alerts.stokMenipis.count}
              href="/admin/inventaris"
              linkText="Periksa Inventaris"
              tone={alerts.stokMenipis.count > 0 ? 'error' : 'neutral'}
            />

            {/* Alert 4: Retribusi PBG Jatuh Tempo */}
            <AlertCard
              title="PBG Jatuh Tempo ≤ 3 Hari"
              description="Ketetapan retribusi PBG belum bayar yang mendekati batas waktu jatuh tempo."
              count={alerts.pbgDueSoon.count}
              href="/admin/pbg"
              linkText="Lihat Tagihan"
              tone={alerts.pbgDueSoon.count > 0 ? 'warning' : 'neutral'}
            />
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Quick Access Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link href="/admin/jadwal">
          <Card variant="interactive" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-btn bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Kelola Jadwal Pegawai</p>
                <p className="text-xs text-text-secondary">Buat rentang penugasan kalender dinas</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-neutral" />
          </Card>
        </Link>

        <Link href="/admin/pegawai">
          <Card variant="interactive" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-btn bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Manajemen Aparatur</p>
                <p className="text-xs text-text-secondary">Kelola akun, mutasi bidang, & sandi</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-neutral" />
          </Card>
        </Link>

        <Link href="/admin/pbg">
          <Card variant="interactive" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-btn bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Monitoring Retribusi</p>
                <p className="text-xs text-text-secondary">Pencatatan SKRD & pelunasan PBG</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-neutral" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
