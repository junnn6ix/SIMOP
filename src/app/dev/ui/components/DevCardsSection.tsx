import * as React from 'react';
import { Users, Calendar, CheckSquare, Package, Building2, Phone, Mail } from 'lucide-react';
import { Section } from '@/components/layout/Section';
import { CardGroup } from '@/components/shared/CardGroup';
import { StatCard } from '@/components/shared/StatCard';
import { InfoCard } from '@/components/shared/InfoCard';
import { AlertCard } from '@/components/shared/AlertCard';

export function DevCardsSection() {
  return (
    <Section
      title="4. Kartu Statistik & Informasi (Cards)"
      description="StatCard dengan CardGroup responsif, InfoCard label-nilai profil, dan AlertCard panel notifikasi."
    >
      <div className="space-y-6">
        <CardGroup columns={4}>
          <StatCard
            label="Total Pegawai"
            value={42}
            icon={<Users className="h-5 w-5" />}
            description="38 aktif bertugas"
            href="#pegawai"
          />
          <StatCard
            label="Tugas Hari Ini"
            value={16}
            icon={<Calendar className="h-5 w-5" />}
            trend={{ value: '+4 tugas baru', isPositive: true }}
          />
          <StatCard
            label="Verifikasi Laporan"
            value={5}
            icon={<CheckSquare className="h-5 w-5" />}
            description="Perlu tindakan segera"
            href="#verifikasi"
          />
          <StatCard
            label="Barang Stok Tipis"
            value={3}
            icon={<Package className="h-5 w-5" />}
            trend={{ value: 'Stok <= limit', isPositive: false }}
            href="#inventaris"
          />
        </CardGroup>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard
            title="Profil Pegawai Lapangan"
            description="Detail data kepegawaian dan kontak dinas"
            items={[
              { label: 'Nama Lengkap', value: 'Budi Santoso, S.Kom' },
              { label: 'NIP', value: '198704152010011003' },
              { label: 'Bidang', value: 'Pelayanan Terpadu Satu Pintu (PTSP)', icon: <Building2 className="h-3.5 w-3.5" /> },
              { label: 'Jabatan', value: 'Petugas Loket Pelayanan 2' },
              { label: 'Nomor WhatsApp', value: '081234567890', icon: <Phone className="h-3.5 w-3.5" /> },
              { label: 'Status Akun', value: 'Aktif Bertugas', icon: <Mail className="h-3.5 w-3.5" /> },
            ]}
          />

          <div className="space-y-4">
            <h4 className="text-sm font-bold font-display text-text-primary">
              Panel Notifikasi Aksi Cepat (AlertCard)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AlertCard
                title="Laporan Lapangan"
                description="Menunggu verifikasi verifikator"
                count={5}
                href="#verifikasi"
                tone="warning"
              />
              <AlertCard
                title="Retribusi PBG Jatuh Tempo"
                description="Tagihan PBG mendekati H-3"
                count={8}
                href="#pbg"
                tone="error"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

