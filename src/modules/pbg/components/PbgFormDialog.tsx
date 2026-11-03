'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PlusCircle, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { createPbgSchema, updatePbgSchema } from '../schema';
import { createPbgAction, updatePbgAction } from '../actions';

export interface PbgFormData {
  id?: string;
  pemohon: string;
  noWa: string;
  noSkrd: string;
  lokasi: string;
  nominal: number;
  jatuhTempo: string; // YYYY-MM-DD
}

export interface PbgFormDialogProps {
  initialData?: PbgFormData | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PbgFormContentProps {
  initialData?: PbgFormData | null;
  onClose: () => void;
}

function PbgFormContent({ initialData, onClose }: PbgFormContentProps) {
  const isEditing = Boolean(initialData?.id);

  const [pemohon, setPemohon] = React.useState(initialData?.pemohon || '');
  const [noWa, setNoWa] = React.useState(initialData?.noWa || '');
  const [noSkrd, setNoSkrd] = React.useState(initialData?.noSkrd || '');
  const [lokasi, setLokasi] = React.useState(initialData?.lokasi || '');
  const [nominal, setNominal] = React.useState<number | ''>(
    initialData?.nominal !== undefined ? initialData.nominal : ''
  );
  const [jatuhTempo, setJatuhTempo] = React.useState(initialData?.jatuhTempo || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      pemohon,
      noWa,
      noSkrd,
      lokasi,
      nominal: Number(nominal),
      jatuhTempo,
    };

    if (isEditing && initialData?.id) {
      const validation = updatePbgSchema.safeParse({ ...payload, id: initialData.id });
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message || 'Input formulir tidak valid.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await updatePbgAction(validation.data);
        toast.success(res.message);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal memperbarui tagihan PBG.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const validation = createPbgSchema.safeParse(payload);
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message || 'Input formulir tidak valid.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await createPbgAction(validation.data);
        toast.success(res.message);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal mendaftarkan tagihan PBG.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {errorMessage && (
        <div className="rounded-lg bg-error-tint border border-error/30 p-3 text-xs text-error font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nomor SKRD" required description="Nomor ketetapan resmi unik">
          <Input
            value={noSkrd}
            onChange={(e) => setNoSkrd(e.target.value.toUpperCase())}
            placeholder="Misal: SKRD/2026/001"
            disabled={isLoading}
            className="text-xs uppercase font-mono"
          />
        </FormField>

        <FormField label="Nama Pemohon / Pemilik" required>
          <Input
            value={pemohon}
            onChange={(e) => setPemohon(e.target.value)}
            placeholder="Nama lengkap pemohon..."
            disabled={isLoading}
            className="text-xs"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Nomor WhatsApp Pemohon"
          required
          description="Contoh: 08123456789 (akan dinormalisasi)"
        >
          <Input
            type="tel"
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            placeholder="08xxxxxxxxxx"
            disabled={isLoading}
            className="text-xs font-mono"
          />
        </FormField>

        <FormField label="Tanggal Jatuh Tempo" required>
          <Input
            type="date"
            value={jatuhTempo}
            onChange={(e) => setJatuhTempo(e.target.value)}
            disabled={isLoading}
            className="text-xs"
          />
        </FormField>
      </div>

      <FormField label="Nominal Retribusi (Rupiah)" required>
        <Input
          type="number"
          min={1}
          step={1}
          value={nominal}
          onChange={(e) => setNominal(e.target.value ? Number(e.target.value) : '')}
          placeholder="Contoh: 15000000"
          disabled={isLoading}
          className="text-xs font-mono"
        />
      </FormField>

      <FormField label="Lokasi Bangunan / Proyek" required>
        <Textarea
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
          placeholder="Alamat lengkap lokasi bangunan atau proyek perizinan..."
          rows={3}
          disabled={isLoading}
          className="resize-none text-xs"
        />
      </FormField>

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Daftarkan Tagihan'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PbgFormDialog({
  initialData,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PbgFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const isEditing = Boolean(initialData?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : isEditing ? (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="primary" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Tambah Tagihan PBG
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Ubah Data Tagihan Retribusi PBG' : 'Pendaftaran Tagihan Retribusi PBG'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui rincian ketetapan retribusi PBG dan kontak pemohon.'
              : 'Daftarkan ketetapan retribusi PBG baru berdasarkan dokumen SKRD resmi.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PbgFormContent
            key={initialData?.id || 'new-pbg'}
            initialData={initialData}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
