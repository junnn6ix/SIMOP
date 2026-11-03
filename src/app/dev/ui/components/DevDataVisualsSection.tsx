'use client';

import * as React from 'react';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/shared/Card';
import { Timeline } from '@/components/shared/Timeline';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { DonutChart } from '@/components/shared/DonutChart';
import { KeyValueList } from '@/components/shared/KeyValueList';
import { FilePreview } from '@/components/shared/FilePreview';
import { Avatar } from '@/components/shared/Avatar';

export function DevDataVisualsSection() {
  return (
    <Section
      title="6. Tampilan Data & Visualisasi (Visuals & Charts)"
      description="Timeline linimasa jadwal, ProgressRing, DonutChart SVG responsif, KeyValueList, FilePreview, dan Avatar inisial lokal."
    >
      <div className="space-y-6">
        {/* Avatars */}
        <Card className="p-6 space-y-3">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary">
            Avatar Inisial Lokal (sm, md, lg, xl - 9999px)
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="Ahmad Fauzi" size="sm" />
            <Avatar name="Budi Santoso" size="md" />
            <Avatar name="Citra Lestari" size="lg" />
            <Avatar name="Dewi Sartika" size="xl" />
          </div>
        </Card>

        {/* Charts & Ring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold font-display text-text-primary">
              ProgressRing Capaian Tugas
            </h4>
            <div className="flex flex-wrap items-center justify-around gap-6 pt-2">
              <ProgressRing
                value={75}
                size={130}
                sublabel="Selesai (15/20)"
                color="var(--color-chart-1)"
              />
              <ProgressRing
                value={100}
                size={110}
                sublabel="PBG Lunas (100%)"
                color="var(--color-success)"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold font-display text-text-primary">
              DonutChart Distribusi Petugas Lapangan
            </h4>
            <DonutChart
              size={130}
              centerLabel="Petugas"
              segments={[
                { label: 'Loket Pelayanan', value: 12, color: 'var(--color-chart-1)' },
                { label: 'Kecamatan', value: 8, color: 'var(--color-chart-2)' },
                { label: 'Kantor Dinas', value: 16, color: 'var(--color-chart-3)' },
                { label: 'Lainnya', value: 6, color: 'var(--color-chart-4)' },
              ]}
            />
          </Card>
        </div>

        {/* Timeline & KeyValue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold font-display text-text-primary">
              Timeline Agenda Tugas Pegawai
            </h4>
            <Timeline
              items={[
                {
                  id: 'j-1',
                  title: 'Pelayanan Perizinan Berusaha',
                  timestamp: '08:00 - 12:00 WIB',
                  location: 'Loket 1 DPMPTSP',
                  officer: 'Budi Santoso',
                  status: 'SELESAI',
                },
                {
                  id: 'j-2',
                  title: 'Monitoring Lapangan PBG Sektor Industri',
                  timestamp: '13:00 - 15:30 WIB',
                  location: 'Kecamatan Klari',
                  officer: 'Ahmad Fauzi & Tim',
                  status: 'MENUNGGU_VERIFIKASI',
                  description: 'Foto bukti dan berita acara telah diunggah.',
                },
                {
                  id: 'j-3',
                  title: 'Verifikasi Teknis Lapangan',
                  timestamp: '16:00 - 17:00 WIB',
                  location: 'Kecamatan Telukjambe Timur',
                  status: 'BELUM_DIKERJAKAN',
                },
              ]}
            />
          </Card>

          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h4 className="text-sm font-bold font-display text-text-primary">
                KeyValueList Rincian Transaksi
              </h4>
              <KeyValueList
                items={[
                  { label: 'Nomor SKRD', value: 'SKRD-2026-PBG-0041' },
                  { label: 'Nama Pemohon', value: 'PT Graha Karawang Sejahtera' },
                  { label: 'Nominal Retribusi', value: 'Rp 45.500.000' },
                  { label: 'Batas Jatuh Tempo', value: '15 November 2026' },
                ]}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h4 className="text-sm font-bold font-display text-text-primary">
                FilePreview (Pratinjau Berkas & PDF)
              </h4>
              <div className="space-y-3">
                <FilePreview
                  url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"
                  fileName="Bukti_Foto_Kunjungan_PBG.jpg"
                  fileType="image"
                />
                <FilePreview
                  url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                  fileName="Berita_Acara_Pemeriksaan_Teknis.pdf"
                  fileType="pdf"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Section>
  );
}

