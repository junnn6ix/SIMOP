'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adjustStokAction } from '../actions';

export interface AdjustStokTarget {
  id: string;
  nama: string;
  kodeBarang: string;
  stok: number;
  satuan: string | null;
}

export interface AdjustStokDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: AdjustStokTarget | null;
}

interface AdjustStokFormProps {
  target: AdjustStokTarget;
  onClose: () => void;
}

function AdjustStokFormContent({ target, onClose }: AdjustStokFormProps) {
  const [tipe, setTipe] = React.useState<'MASUK' | 'KELUAR'>('MASUK');
  const [jumlah, setJumlah] = React.useState(1);
  const [keterangan, setKeterangan] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jumlah <= 0) {
      toast.error('Jumlah mutasi stok minimal 1.');
      return;
    }

    if (tipe === 'KELUAR' && jumlah > target.stok) {
      toast.error(`Stok saat ini (${target.stok}) tidak cukup untuk pengurangan ${jumlah}.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await adjustStokAction({
        barangId: target.id,
        tipe,
        jumlah,
        keterangan: keterangan.trim(),
      });
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyesuaikan stok barang.');
    } finally {
      setIsLoading(false);
    }
  };

  const perkiraanStok =
    tipe === 'MASUK' ? target.stok + Number(jumlah || 0) : target.stok - Number(jumlah || 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <DialogBody className="space-y-4">
        <div className="p-3 rounded-panel bg-muted/40 border border-border text-xs space-y-1">
          <div className="text-text-secondary">Barang:</div>
          <div className="font-semibold text-text-primary text-sm">
            {target.nama} ({target.kodeBarang})
          </div>
          <div className="text-text-secondary">
            Stok Saat Ini: <span className="font-semibold text-text-primary">{target.stok} {target.satuan || 'Pcs'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Arah Mutasi" required>
            <Select
              value={tipe}
              onValueChange={(val: any) => setTipe(val)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Arah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASUK">Penambahan (MASUK)</SelectItem>
                <SelectItem value="KELUAR">Pengurangan (KELUAR)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={`Jumlah (${target.satuan || 'Pcs'})`} required>
            <Input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Math.max(1, parseInt(e.target.value) || 0))}
              required
              disabled={isLoading}
            />
          </FormField>
        </div>

        <div className="text-xs text-text-secondary flex items-center justify-between px-1">
          <span>Perkiraan stok akhir:</span>
          <span
            className={`font-semibold font-mono ${
              perkiraanStok < 0 ? 'text-error' : 'text-primary'
            }`}
          >
            {perkiraanStok} {target.satuan || 'Pcs'}
          </span>
        </div>

        <FormField
          label="Alasan / Keterangan Penyesuaian"
          required
          description="Contoh: Pengadaan rutin dinas, barang rusak/kadaluarsa, opname fisik"
        >
          <Input
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Tuliskan alasan penyesuaian stok..."
            required
            disabled={isLoading}
          />
        </FormField>
      </DialogBody>

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || perkiraanStok < 0 || !keterangan.trim()}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Mutasi'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustStokDialog({
  open,
  onOpenChange,
  target,
}: AdjustStokDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Penyesuaian Stok Barang</DialogTitle>
          <DialogDescription>
            Catat penambahan stok baru atau pengurangan fisik barang secara resmi.
          </DialogDescription>
        </DialogHeader>

        {open && target ? (
          <AdjustStokFormContent
            key={target.id}
            target={target}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

