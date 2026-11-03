'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PlusCircle, AlertCircle, Package, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTiketSchema } from '../schema';
import { createTiketAction } from '../actions';

export interface ActiveBarangOption {
  id: string;
  nama: string;
  kodeBarang: string;
  kategori: 'ATK' | 'ASET';
  stok: number;
  satuan: string | null;
}

export interface TiketFormDialogProps {
  barangOptions: ActiveBarangOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TiketFormDialog({
  barangOptions,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TiketFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [jenis, setJenis] = React.useState<'PERMINTAAN_BARANG' | 'LAPOR_KERUSAKAN'>('PERMINTAAN_BARANG');
  const [barangId, setBarangId] = React.useState('');
  const [jumlah, setJumlah] = React.useState(1);
  const [keperluan, setKeperluan] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const selectedBarang = React.useMemo(() => {
    return barangOptions.find((b) => b.id === barangId) || null;
  }, [barangOptions, barangId]);

  const isStockInsufficient =
    jenis === 'PERMINTAAN_BARANG' &&
    selectedBarang !== null &&
    selectedBarang.stok < (jumlah || 1);

  const resetForm = () => {
    setJenis('PERMINTAAN_BARANG');
    setBarangId('');
    setJumlah(1);
    setKeperluan('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = createTiketSchema.safeParse({
      barangId,
      jenis,
      jumlah,
      keperluan,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'Input formulir tidak valid.');
      return;
    }

    if (isStockInsufficient) {
      setErrorMessage(`Stok barang tidak mencukupi (tersedia: ${selectedBarang?.stok}, diminta: ${jumlah}).`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await createTiketAction(validation.data);
      toast.success(res.message);
      resetForm();
      setOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengajukan tiket layanan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="primary" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Ajukan Tiket
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pengajuan Tiket Layanan</DialogTitle>
          <DialogDescription>
            Ajukan permintaan barang ATK/perlengkapan kerja atau laporkan kerusakan aset kantor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-error-tint border border-error/30 p-3 text-xs text-error font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pemilihan Jenis Layanan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Jenis Layanan <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJenis('PERMINTAAN_BARANG')}
                className={`flex flex-col items-center justify-between rounded-lg border-2 p-3 text-center transition-all ${
                  jenis === 'PERMINTAAN_BARANG'
                    ? 'border-brand bg-brand/5 text-text-primary ring-1 ring-brand/30'
                    : 'border-border bg-card text-text-secondary hover:bg-neutral-tint/50'
                }`}
              >
                <Package className="h-5 w-5 mb-1.5 text-brand" />
                <span className="text-xs font-semibold">Permintaan Barang</span>
                <span className="text-2xs text-text-secondary mt-0.5">
                  ATK & Alat Tulis
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJenis('LAPOR_KERUSAKAN')}
                className={`flex flex-col items-center justify-between rounded-lg border-2 p-3 text-center transition-all ${
                  jenis === 'LAPOR_KERUSAKAN'
                    ? 'border-warning bg-warning-tint/50 text-text-primary ring-1 ring-warning/30'
                    : 'border-border bg-card text-text-secondary hover:bg-neutral-tint/50'
                }`}
              >
                <Wrench className="h-5 w-5 mb-1.5 text-warning" />
                <span className="text-xs font-semibold">Lapor Kerusakan</span>
                <span className="text-2xs text-text-secondary mt-0.5">
                  Aset & Sarana Prasarana
                </span>
              </button>
            </div>
          </div>

          {/* Pemilihan Barang dari Katalog */}
          <FormField label="Pilih Barang / Aset" required>
            <Select value={barangId} onValueChange={setBarangId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih barang dari katalog aktif..." />
              </SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {barangOptions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-text-secondary">
                    Tidak ada katalog barang aktif saat ini.
                  </div>
                ) : (
                  barangOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>
                          {b.nama}{' '}
                          <span className="font-mono text-text-secondary">
                            ({b.kodeBarang})
                          </span>
                        </span>
                        <span className="text-2xs text-text-secondary ml-auto font-mono">
                          Stok: {b.stok} {b.satuan || 'Pcs'}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormField>

          {/* Informasi Stok Barang Terpilih */}
          {selectedBarang && (
            <div className="flex items-center justify-between rounded-lg bg-neutral-tint/50 border border-border px-3 py-2 text-xs">
              <span className="text-text-secondary">
                Kategori: <strong>{selectedBarang.kategori}</strong>
              </span>
              <span className="text-text-secondary">
                Stok Tersedia:{' '}
                <strong
                  className={
                    selectedBarang.stok === 0 ? 'text-error' : 'text-text-primary'
                  }
                >
                  {selectedBarang.stok} {selectedBarang.satuan || 'Pcs'}
                </strong>
              </span>
            </div>
          )}

          {/* Jumlah */}
          <FormField
            label={`Jumlah ${selectedBarang?.satuan ? `(${selectedBarang.satuan})` : ''}`}
            required
          >
            <Input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              disabled={isLoading}
              className="text-xs"
            />
            {isStockInsufficient && (
              <p className="text-2xs text-error font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                Jumlah melebihi stok yang tersedia saat ini ({selectedBarang?.stok}).
              </p>
            )}
          </FormField>

          {/* Keperluan / Keluhan */}
          <FormField
            label={
              jenis === 'PERMINTAAN_BARANG'
                ? 'Keperluan Penggunaan'
                : 'Keterangan Kerusakan / Kendala'
            }
            required
            description="Minimal 5 karakter"
          >
            <Textarea
              placeholder={
                jenis === 'PERMINTAAN_BARANG'
                  ? 'Jelaskan keperluan operasional penggunaan barang ini...'
                  : 'Jelaskan detail kendala atau kerusakan pada aset ini...'
              }
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              disabled={isLoading}
              className="resize-none h-24 text-xs"
            />
          </FormField>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading || isStockInsufficient}>
              {isLoading ? 'Mengajukan...' : 'Kirim Pengajuan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
