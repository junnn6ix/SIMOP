'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/shared/Card';
import { InlineAlert } from '@/components/shared/InlineAlert';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal } from '@/components/shared/Modal';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { FormActions } from '@/components/shared/FormActions';

export function DevFeedbackModalsSection() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <Section
      title="7. Feedback, Dialog & Notifikasi"
      description="InlineAlert, ConfirmDialog, Modal form generik, ErrorState, EmptyState, dan Sonner Toast."
    >
      <div className="space-y-6">
        {/* Inline Alerts */}
        <Card className="p-6 space-y-3">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary">
            Inline Alerts (Info, Success, Warning, Error)
          </h4>
          <div className="space-y-2.5">
            <InlineAlert
              variant="info"
              title="Informasi Penjadwalan"
              description="Hari Sabtu dan Minggu secara otomatis dilewati dari rentang penugasan pegawai."
            />
            <InlineAlert
              variant="success"
              title="Verifikasi Berhasil"
              description="Laporan tugas telah disetujui dan status diubah menjadi SELESAI."
            />
            <InlineAlert
              variant="warning"
              title="Perhatian Stok Menipis"
              description="Terdapat 3 barang dengan stok tersisa kurang dari atau sama dengan batas minimum."
            />
            <InlineAlert
              variant="error"
              title="Penolakan Laporan"
              description="Laporan ditolak karena foto bukti tidak menampilkan lokasi penugasan secara jelas."
            />
          </div>
        </Card>

        {/* Dialog & Toast Triggers */}
        <Card className="p-6 space-y-4">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary">
            Interaksi Dialog & Toast (Pengganti alert() & confirm())
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              Uji ConfirmDialog
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(true)}
            >
              Uji Modal Dialog
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.success('Operasi berhasil disimpan!', {
                  description: 'Perubahan telah dicatat ke dalam database.',
                })
              }
            >
              Toast Success
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.error('Gagal memperbarui data', {
                  description: 'Terjadi kendala pada jaringan, silakan ulangi.',
                })
              }
            >
              Toast Error
            </Button>
          </div>
        </Card>

        {/* States Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ErrorState
            title="Koneksi Terputus"
            description="Tidak dapat menghubungi server database Neon. Silakan periksa koneksi internet Anda."
            onRetry={() => toast.info('Mencoba menyambung kembali...')}
          />
          <EmptyState
            title="Belum Ada Tiket Masuk"
            description="Saat ini belum ada pengajuan permintaan barang atau laporan kerusakan aset."
            actions={
              <Button size="sm" variant="secondary" onClick={() => toast.info('Aksi Buat Tiket')}>
                Buat Tiket Baru
              </Button>
            }
          />
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Konfirmasi Penghapusan Data"
        description="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan jika data belum memiliki riwayat."
        confirmLabel="Hapus Sekarang"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          toast.success('Data berhasil dihapus.');
        }}
      />

      {/* Generic Modal Form */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Formulir Penyesuaian Stok"
        description="Catat transaksi barang masuk atau keluar secara akurat."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setModalOpen(false);
            toast.success('Stok berhasil diperbarui.');
          }}
          className="space-y-4"
        >
          <FormField label="Jumlah Barang" required>
            <Input type="number" defaultValue={10} min={1} />
          </FormField>
          <FormField label="Keterangan / Alasan Penyesuaian" required>
            <Input placeholder="Contoh: Pengadaan rutin bulanan" />
          </FormField>
          <FormActions
            submitLabel="Simpan Penyesuaian"
            onCancel={() => setModalOpen(false)}
          />
        </form>
      </Modal>
    </Section>
  );
}

