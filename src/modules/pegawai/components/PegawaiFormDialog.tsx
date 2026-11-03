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
import { PasswordInput } from '@/components/shared/PasswordInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createPegawaiAction, updatePegawaiAction } from '../actions';

export interface PegawaiFormData {
  id?: string;
  name: string;
  username?: string;
  nip?: string | null;
  bidang: 'SEKRETARIAT' | 'PTSP' | 'PM' | 'PENGAWASAN';
}

export interface PegawaiFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PegawaiFormData | null;
}

interface PegawaiFormContentProps {
  initialData?: PegawaiFormData | null;
  onClose: () => void;
}

function PegawaiFormContent({ initialData, onClose }: PegawaiFormContentProps) {
  const isEditing = Boolean(initialData?.id);
  const [name, setName] = React.useState(initialData?.name || '');
  const [username, setUsername] = React.useState(initialData?.username || '');
  const [password, setPassword] = React.useState('');
  const [nip, setNip] = React.useState(initialData?.nip || '');
  const [bidang, setBidang] = React.useState<'SEKRETARIAT' | 'PTSP' | 'PM' | 'PENGAWASAN'>(
    initialData?.bidang || 'PTSP'
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && initialData?.id) {
        await updatePegawaiAction({
          id: initialData.id,
          name: name.trim(),
          nip: nip.trim() || null,
          bidang,
        });
        toast.success('Data pegawai berhasil diperbarui.');
      } else {
        await createPegawaiAction({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          nip: nip.trim() || null,
          bidang,
        });
        toast.success(`Akun pegawai @${username.trim()} berhasil dibuat.`);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses data pegawai.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <DialogBody className="space-y-4">
        <FormField label="Nama Lengkap" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Budi Santoso, S.Kom."
            required
            disabled={isLoading}
          />
        </FormField>

        {!isEditing && (
          <FormField
            label="Nama Pengguna (Username)"
            required
            description="Hanya huruf kecil, angka, dan underscore"
          >
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Contoh: budi_santoso"
              required
              disabled={isLoading}
            />
          </FormField>
        )}

        {!isEditing && (
          <FormField label="Kata Sandi Awal" required description="Minimal 8 karakter">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi..."
              required
              disabled={isLoading}
            />
          </FormField>
        )}

        <FormField label="NIP (Nomor Induk Pegawai)" description="Opsional / Boleh dikosongkan">
          <Input
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            placeholder="Contoh: 198805122010011002"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Bidang Tugas Dinas" required>
          <Select
            value={bidang}
            onValueChange={(val: any) => setBidang(val)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Bidang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEKRETARIAT">Sekretariat</SelectItem>
              <SelectItem value="PTSP">Pelayanan Terpadu Satu Pintu (PTSP)</SelectItem>
              <SelectItem value="PM">Penanaman Modal (PM)</SelectItem>
              <SelectItem value="PENGAWASAN">Pengawasan & Pengendalian</SelectItem>
            </SelectContent>
          </Select>
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
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading
            ? 'Menyimpan...'
            : isEditing
            ? 'Simpan Perubahan'
            : 'Buat Akun Pegawai'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PegawaiFormDialog({
  open,
  onOpenChange,
  initialData,
}: PegawaiFormDialogProps) {
  const isEditing = Boolean(initialData?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Ubah Data Pegawai' : 'Tambah Akun Pegawai Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi identitas, NIP, atau bidang penugasan pegawai.'
              : 'Daftarkan pegawai dinas baru untuk dapat mengakses sistem SIMOP DPMPTSP.'}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <PegawaiFormContent
            key={initialData?.id || 'new'}
            initialData={initialData}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
