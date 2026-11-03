'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { FormActions } from '@/components/shared/FormActions';
import { FileDropzone } from '@/components/shared/FileDropzone';
import { Textarea } from '@/components/ui/textarea';
import { submitLaporanAction } from '../actions';

export interface UploadLaporanTarget {
  id: string;
  judul: string;
  catatanVerifikator?: string | null;
}

export interface UploadLaporanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jadwal: UploadLaporanTarget | null;
  onSuccess?: () => void;
}

interface UploadFormProps {
  jadwal: UploadLaporanTarget;
  onClose: () => void;
  onSuccess?: () => void;
}

function UploadFormContent({ jadwal, onClose, onSuccess }: UploadFormProps) {
  const [fotoFile, setFotoFile] = React.useState<File | null>(null);
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [laporanTeks, setLaporanTeks] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fotoFile) {
      setErrorMessage('Foto bukti pelaksanaan tugas wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Minta presigned URL untuk foto bukti
      const fotoSignRes = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jadwalId: jadwal.id,
          slot: 'foto',
          contentType: fotoFile.type,
          fileSize: fotoFile.size,
        }),
      });

      if (!fotoSignRes.ok) {
        const errJson = await fotoSignRes.json();
        throw new Error(errJson.error || 'Gagal menyiapkan unggahan foto.');
      }

      const { presignedUrl: fotoPresignedUrl, objectKey: fotoKey } =
        await fotoSignRes.json();

      // 2. Upload foto langsung ke Cloudflare R2
      const fotoUploadRes = await fetch(fotoPresignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fotoFile.type,
        },
        body: fotoFile,
      });

      if (!fotoUploadRes.ok) {
        throw new Error('Gagal mengunggah berkas foto ke Cloudflare R2.');
      }

      // 3. Jika ada berkas PDF, minta presigned URL dan upload
      let pdfKey: string | undefined = undefined;
      if (pdfFile) {
        const pdfSignRes = await fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jadwalId: jadwal.id,
            slot: 'pdf',
            contentType: pdfFile.type,
            fileSize: pdfFile.size,
          }),
        });

        if (!pdfSignRes.ok) {
          const errJson = await pdfSignRes.json();
          throw new Error(errJson.error || 'Gagal menyiapkan unggahan PDF.');
        }

        const { presignedUrl: pdfPresignedUrl, objectKey: uploadedPdfKey } =
          await pdfSignRes.json();

        const pdfUploadRes = await fetch(pdfPresignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': pdfFile.type,
          },
          body: pdfFile,
        });

        if (!pdfUploadRes.ok) {
          throw new Error('Gagal mengunggah berkas PDF ke Cloudflare R2.');
        }

        pdfKey = uploadedPdfKey;
      }

      // 4. Konfirmasi laporan ke server action
      const res = await submitLaporanAction({
        jadwalId: jadwal.id,
        buktiKey: fotoKey,
        pdfKey: pdfKey || null,
        laporanTeks: laporanTeks.trim() || null,
      });

      toast.success(res.message);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {jadwal.catatanVerifikator && (
        <div className="flex items-start gap-3 p-3 rounded-panel bg-warning-tint border border-warning/30 text-warning-contrast text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
          <div>
            <div className="font-semibold">Perhatian: Laporan Sebelumnya Ditolak</div>
            <div className="mt-0.5">{jadwal.catatanVerifikator}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-panel bg-error-tint border border-error/30 text-xs text-error font-medium">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-primary">
          Foto Bukti Lapangan <span className="text-error">*</span>
        </label>
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          maxSizeMb={5}
          value={fotoFile}
          onChange={setFotoFile}
          label="Pilih atau seret foto bukti pelaksanaan"
          helperText="Format: JPG, PNG, WEBP (maks. 5 MB)"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-primary">
          Dokumen PDF Pendukung (Opsional)
        </label>
        <FileDropzone
          accept="application/pdf"
          maxSizeMb={5}
          value={pdfFile}
          onChange={setPdfFile}
          label="Pilih atau seret dokumen PDF"
          helperText="Format: PDF (maks. 5 MB)"
          disabled={isSubmitting}
        />
      </div>

      <FormField
        label="Catatan & Ringkasan Laporan"
        description="Tuliskan ringkasan hasil kegiatan pelaksanaan tugas (opsional)"
      >
        <Textarea
          value={laporanTeks}
          onChange={(e) => setLaporanTeks(e.target.value)}
          placeholder="Contoh: Telah melaksanakan verifikasi lapangan ke lokasi pemohon..."
          rows={3}
          disabled={isSubmitting}
        />
      </FormField>

      <FormActions
        submitLabel={isSubmitting ? 'Mengunggah & Mengirim...' : 'Kirim Laporan'}
        cancelLabel="Batal"
        isLoading={isSubmitting}
        submitDisabled={!fotoFile}
        onCancel={onClose}
      />
    </form>
  );
}

export function UploadLaporanDialog({
  open,
  onOpenChange,
  jadwal,
  onSuccess,
}: UploadLaporanDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Unggah Bukti Pelaksanaan Tugas"
      description={`Kirim laporan pelaksanaan untuk tugas: "${jadwal?.judul || ''}"`}
      maxWidth="lg"
    >
      {open && jadwal ? (
        <UploadFormContent
          key={jadwal.id}
          jadwal={jadwal}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      ) : null}
    </Modal>
  );
}
