'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, FileText, Image as ImageIcon, MapPin, Building, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateShort } from '@/lib/dates';
import { verifikasiJadwalAction } from '../actions';

export interface VerifikasiItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggal: string;
  pegawaiId: string;
  pegawaiName: string;
  pegawaiUsername: string | null;
  pegawaiBidang: string;
  lokasiTipe: 'LOKET' | 'KECAMATAN' | 'KANTOR' | 'LAINNYA';
  alamatLokasi: string | null;
  status: 'MENUNGGU_VERIFIKASI' | string;
  catatanVerifikator: string | null;
  buktiKey: string | null;
  pdfKey: string | null;
  updatedAt: Date;
}

export interface VerifikasiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VerifikasiItem | null;
  onSuccess?: () => void;
}

interface VerifikasiContentProps {
  item: VerifikasiItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function VerifikasiModalContent({ item, onClose, onSuccess }: VerifikasiContentProps) {
  const [catatan, setCatatan] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionType, setActionType] = React.useState<'ACC' | 'TOLAK' | null>(null);

  // Preview URLs
  const [fotoUrl, setFotoUrl] = React.useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const fetchUrls = async () => {
      try {
        if (item.buktiKey) {
          const res = await fetch(`/api/uploads/preview?key=${encodeURIComponent(item.buktiKey)}`);
          if (res.ok && !cancelled) {
            const json = await res.json();
            setFotoUrl(json.previewUrl);
          }
        }

        if (item.pdfKey) {
          const res = await fetch(`/api/uploads/preview?key=${encodeURIComponent(item.pdfKey)}`);
          if (res.ok && !cancelled) {
            const json = await res.json();
            setPdfUrl(json.previewUrl);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil berkas pratinjau:', err);
      } finally {
        if (!cancelled) {
          setIsLoadingMedia(false);
        }
      }
    };

    fetchUrls();

    return () => {
      cancelled = true;
    };
  }, [item]);

  const handleDecision = async (decision: 'ACC' | 'TOLAK') => {
    if (decision === 'TOLAK' && (!catatan.trim() || catatan.trim().length < 5)) {
      toast.error('Tuliskan alasan penolakan (minimal 5 karakter) untuk pegawai.');
      return;
    }

    setIsSubmitting(true);
    setActionType(decision);

    try {
      const res = await verifikasiJadwalAction({
        jadwalId: item.id,
        decision,
        catatanVerifikator: decision === 'TOLAK' ? catatan.trim() : null,
      });

      toast.success(res.message);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses verifikasi laporan.');
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ringkasan Tugas & Pegawai */}
      <div className="p-3.5 rounded-panel border border-border bg-muted/40 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs text-text-secondary">Pegawai Pelaksana</div>
            <div className="font-semibold text-text-primary text-base">
              {item.pegawaiName}{' '}
              <span className="text-xs font-normal text-text-secondary">
                (@{item.pegawaiUsername})
              </span>
            </div>
          </div>

          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-primary w-fit">
            Bidang: {item.pegawaiBidang}
          </span>
        </div>

        <div className="pt-2 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
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

      {/* Bukti Foto & Berkas */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-text-primary">
          Berkas Bukti Pelaksanaan
        </div>

        {isLoadingMedia ? (
          <div className="p-8 text-center text-xs text-text-secondary border border-dashed border-border rounded-panel">
            Memuat berkas bukti dari penyimpanan R2...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Foto Bukti Utama */}
            <div className="border border-border rounded-panel p-2 bg-surface">
              <div className="text-[11px] font-semibold text-text-secondary mb-1.5 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Foto Bukti Lapangan (Wajib)</span>
              </div>
              {fotoUrl ? (
                <a
                  href={fotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group relative overflow-hidden rounded border border-border/50 bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fotoUrl}
                    alt="Bukti Tugas"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                    <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-text-primary font-medium transition-opacity">
                      Klik untuk Memperbesar
                    </div>
                </a>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-text-secondary">
                  Tidak ada foto bukti.
                </div>
              )}
            </div>

            {/* Dokumen PDF Pendukung */}
            <div className="border border-border rounded-panel p-2 bg-surface flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-text-secondary mb-1.5 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Dokumen Pendukung (PDF)</span>
                </div>
                {pdfUrl ? (
                  <div className="p-4 rounded border border-border bg-muted/40 text-center space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-primary" />
                    <div className="text-xs font-medium text-text-primary">
                      Dokumen PDF Terlampir
                    </div>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Buka Dokumen PDF
                    </a>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs text-text-secondary">
                    Tidak melampirkan berkas PDF.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Catatan Verifikator */}
      <FormField
        label="Catatan Verifikator"
        description="Wajib diisi jika menolak laporan agar pegawai mengetahui alasan dan perbaikan yang diperlukan."
      >
        <Textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Tuliskan catatan revisi jika ditolak, atau catatan apresiasi..."
          rows={2}
          disabled={isSubmitting}
        />
      </FormField>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Tutup
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => handleDecision('TOLAK')}
            className="gap-1.5 w-full sm:w-auto"
          >
            <XCircle className="h-4 w-4" />
            <span>{actionType === 'TOLAK' ? 'Menolak...' : 'Tolak Laporan'}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={isSubmitting}
            onClick={() => handleDecision('ACC')}
            className="gap-1.5 w-full sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{actionType === 'ACC' ? 'Menyetujui...' : 'Setujui (ACC)'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VerifikasiDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: VerifikasiDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Verifikasi Laporan Pelaksanaan Tugas"
      description="Periksa bukti foto, dokumen pendukung, dan catatan laporan pegawai."
      maxWidth="xl"
    >
      {open && item ? (
        <VerifikasiModalContent
          key={item.id}
          item={item}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      ) : null}
    </Modal>
  );
}
