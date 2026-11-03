'use client';

import * as React from 'react';
import { Calendar, MapPin, Building, Upload, AlertCircle, FileSearch, Eye } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateShort } from '@/lib/dates';
import { UploadLaporanDialog, UploadLaporanTarget } from './UploadLaporanDialog';

export interface JadwalPegawaiItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggal: string;
  lokasiTipe: 'LOKET' | 'KECAMATAN' | 'KANTOR' | 'LAINNYA';
  alamatLokasi: string | null;
  status: 'BELUM_DIKERJAKAN' | 'MENUNGGU_VERIFIKASI' | 'SELESAI' | 'DITOLAK';
  catatanVerifikator: string | null;
  buktiKey: string | null;
  pdfKey: string | null;
  diverifikasiPada: Date | null;
  createdAt: Date;
}

export interface JadwalPegawaiTimelineProps {
  initialItems: JadwalPegawaiItem[];
}

export function JadwalPegawaiTimeline({ initialItems }: JadwalPegawaiTimelineProps) {
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [selectedJadwal, setSelectedJadwal] = React.useState<UploadLaporanTarget | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  // Preview state
  const [previewItem, setPreviewItem] = React.useState<JadwalPegawaiItem | null>(null);
  const [previewFotoUrl, setPreviewFotoUrl] = React.useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = React.useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  const filteredItems = React.useMemo(() => {
    if (statusFilter === 'ALL') return initialItems;
    return initialItems.filter((item) => item.status === statusFilter);
  }, [initialItems, statusFilter]);

  const handleOpenUpload = (item: JadwalPegawaiItem) => {
    setSelectedJadwal({
      id: item.id,
      judul: item.judul,
      catatanVerifikator: item.catatanVerifikator,
    });
    setIsUploadOpen(true);
  };

  const handleOpenPreview = async (item: JadwalPegawaiItem) => {
    setPreviewItem(item);
    setPreviewFotoUrl(null);
    setPreviewPdfUrl(null);
    setIsLoadingPreview(true);

    try {
      if (item.buktiKey) {
        const res = await fetch(`/api/uploads/preview?key=${encodeURIComponent(item.buktiKey)}`);
        if (res.ok) {
          const json = await res.json();
          setPreviewFotoUrl(json.previewUrl);
        }
      }

      if (item.pdfKey) {
        const res = await fetch(`/api/uploads/preview?key=${encodeURIComponent(item.pdfKey)}`);
        if (res.ok) {
          const json = await res.json();
          setPreviewPdfUrl(json.previewUrl);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil pratinjau bukti:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status Tugas"
          allOptionLabel="Semua Status"
          options={[
            { label: 'Belum Dikerjakan', value: 'BELUM_DIKERJAKAN' },
            { label: 'Menunggu Verifikasi', value: 'MENUNGGU_VERIFIKASI' },
            { label: 'Selesai Terverifikasi', value: 'SELESAI' },
          ]}
        />
        <div className="text-xs text-text-secondary">
          Total: <span className="font-semibold text-text-primary">{filteredItems.length}</span> penugasan
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="Tidak Ada Jadwal Tugas"
          description={
            statusFilter === 'ALL'
              ? 'Anda belum memiliki jadwal penugasan tugas saat ini.'
              : 'Tidak ada penugasan dengan status yang dipilih.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const isRejected = item.status === 'BELUM_DIKERJAKAN' && Boolean(item.catatanVerifikator);

            return (
              <div
                key={item.id}
                className="p-4 rounded-panel border border-border bg-surface hover:border-text-neutral transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary text-base">
                        {item.judul}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDateShort(item.tanggal)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.lokasiTipe === 'LOKET' || item.lokasiTipe === 'KANTOR' ? (
                          <Building className="h-3.5 w-3.5" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                        )}
                        <span>
                          {item.lokasiTipe === 'LOKET'
                            ? 'Loket Pelayanan'
                            : item.lokasiTipe === 'KECAMATAN'
                            ? 'Layanan Kecamatan'
                            : item.lokasiTipe === 'KANTOR'
                            ? 'Kantor Dinas'
                            : 'Lainnya / Lapangan'}
                        </span>
                        {item.alamatLokasi && <span>• {item.alamatLokasi}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0">
                    {item.status === 'BELUM_DIKERJAKAN' && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenUpload(item)}
                        className="gap-1.5"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Kirim Laporan</span>
                      </Button>
                    )}

                    {(item.status === 'MENUNGGU_VERIFIKASI' || item.status === 'SELESAI') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenPreview(item)}
                        className="gap-1.5"
                      >
                        <FileSearch className="h-4 w-4" />
                        <span>Lihat Bukti</span>
                      </Button>
                    )}
                  </div>
                </div>

                {item.deskripsi && (
                  <p className="text-xs text-text-secondary bg-muted/30 p-2.5 rounded-btn">
                    {item.deskripsi}
                  </p>
                )}

                {isRejected && (
                  <div className="flex items-start gap-2.5 p-3 rounded-btn bg-warning-tint border border-warning/30 text-xs text-warning-contrast">
                    <AlertCircle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                    <div>
                      <div className="font-semibold">Catatan Verifikator (Revisi Diperlukan)</div>
                      <div className="mt-0.5">{item.catatanVerifikator}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <UploadLaporanDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        jadwal={selectedJadwal}
      />

      {/* Preview Dialog */}
      <Dialog
        open={Boolean(previewItem)}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bukti Pelaksanaan: {previewItem?.judul}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {isLoadingPreview ? (
              <div className="p-8 text-center text-sm text-text-secondary">
                Memuat berkas bukti...
              </div>
            ) : (
              <div className="space-y-3">
                {previewFotoUrl && (
                  <div>
                    <div className="text-xs font-semibold text-text-primary mb-1.5">
                      Foto Bukti Lapangan
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewFotoUrl}
                      alt="Foto Bukti Tugas"
                      className="w-full max-h-96 object-contain rounded-panel border border-border bg-black/5"
                    />
                  </div>
                )}

                {previewPdfUrl && (
                  <div className="pt-2">
                    <a
                      href={previewPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Buka Dokumen PDF Pendukung</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
