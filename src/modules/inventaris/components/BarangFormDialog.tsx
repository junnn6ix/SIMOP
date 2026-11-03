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
import { createBarangAction, updateBarangAction } from '../actions';

export interface BarangFormData {
  id?: string;
  nama: string;
  kodeBarang?: string | null;
  kategori: 'ATK' | 'ASET';
  stok?: number;
  limitStok?: number;
  satuan?: string | null;
  deskripsi?: string | null;
}

export interface BarangFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: BarangFormData | null;
}

interface BarangFormContentProps {
  initialData?: BarangFormData | null;
  onClose: () => void;
}

function BarangFormContent({ initialData, onClose }: BarangFormContentProps) {
  const isEditing = Boolean(initialData?.id);
  const [nama, setNama] = React.useState(initialData?.nama || '');
  const [kodeBarang, setKodeBarang] = React.useState(initialData?.kodeBarang || '');
  const [kategori, setKategori] = React.useState<'ATK' | 'ASET'>(initialData?.kategori || 'ATK');
  const [stok, setStok] = React.useState(initialData?.stok ?? 0);
  const [limitStok, setLimitStok] = React.useState(initialData?.limitStok ?? 5);
  const [satuan, setSatuan] = React.useState(initialData?.satuan || 'Pcs');
  const [deskripsi, setDeskripsi] = React.useState(initialData?.deskripsi || '');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && initialData?.id) {
        await updateBarangAction({
          id: initialData.id,
          nama: nama.trim(),
          kategori,
          limitStok: Number(limitStok) || 0,
          satuan: satuan.trim() || 'Pcs',
          deskripsi: deskripsi.trim() || null,
        });
        toast.success('Data barang berhasil diperbarui.');
      } else {
        await createBarangAction({
          nama: nama.trim(),
          kodeBarang: kodeBarang.trim() || null,
          kategori,
          stok: Number(stok) || 0,
          limitStok: Number(limitStok) || 0,
          satuan: satuan.trim() || 'Pcs',
          deskripsi: deskripsi.trim() || null,
        });
        toast.success(`Barang "${nama.trim()}" berhasil didaftarkan.`);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses data barang.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <FormField label="Nama Barang" required>
        <Input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Kertas HVS A4 80gsm"
          required
          disabled={isLoading}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Kategori Barang" required>
          <Select
            value={kategori}
            onValueChange={(val: any) => setKategori(val)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ATK">ATK (Alat Tulis Kantor / Habis Pakai)</SelectItem>
              <SelectItem value="ASET">ASET (Peralatan / Inventaris Tetap)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Satuan" required>
          <Input
            value={satuan}
            onChange={(e) => setSatuan(e.target.value)}
            placeholder="Contoh: Rim, Pcs, Box, Unit"
            required
            disabled={isLoading}
          />
        </FormField>
      </div>

      {!isEditing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Kode Barang"
            description="Boleh dikosongkan (otomatis dibuatkan sistem)"
          >
            <Input
              value={kodeBarang}
              onChange={(e) => setKodeBarang(e.target.value.toUpperCase())}
              placeholder="Contoh: BRG-ATK-001"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Stok Awal" required>
            <Input
              type="number"
              min={0}
              value={stok}
              onChange={(e) => setStok(Number(e.target.value))}
              disabled={isLoading}
            />
          </FormField>
        </div>
      )}

      <FormField
        label="Batas Minimal Stok (Limit Stok)"
        description="Peringatan stok menipis otomatis jika stok <= angka ini"
        required
      >
        <Input
          type="number"
          min={0}
          value={limitStok}
          onChange={(e) => setLimitStok(Number(e.target.value))}
          disabled={isLoading}
          required
        />
      </FormField>

      <FormField
        label="Deskripsi / Catatan Spesifikasi"
        description="Spesifikasi teknis, merk, atau lokasi simpan (opsional)"
      >
        <Textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Deskripsi spesifikasi barang..."
          rows={3}
          disabled={isLoading}
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
          {isLoading
            ? 'Menyimpan...'
            : isEditing
            ? 'Simpan Perubahan'
            : 'Tambah Barang'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BarangFormDialog({
  open,
  onOpenChange,
  initialData,
}: BarangFormDialogProps) {
  const isEditing = Boolean(initialData?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Ubah Data Barang' : 'Tambah Barang Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui nama, kategori, atau deskripsi barang inventaris.'
              : 'Daftarkan barang habis pakai (ATK) atau aset dinas baru ke inventaris.'}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <BarangFormContent
            key={initialData?.id || 'new'}
            initialData={initialData}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

