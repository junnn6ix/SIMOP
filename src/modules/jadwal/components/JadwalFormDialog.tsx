'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { FormActions } from '@/components/shared/FormActions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createJadwalRangeSchema, CreateJadwalRangeInput } from '../schema';
import { createJadwalRangeAction } from '../actions';

export interface PegawaiOption {
  id: string;
  name: string;
  username: string | null;
  bidang: string;
}

export interface JadwalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pegawaiOptions: PegawaiOption[];
}

interface JadwalFormContentProps {
  pegawaiOptions: PegawaiOption[];
  onClose: () => void;
}

function JadwalFormContent({ pegawaiOptions, onClose }: JadwalFormContentProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const todayStr = React.useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateJadwalRangeInput>({
    resolver: zodResolver(createJadwalRangeSchema),
    defaultValues: {
      judul: '',
      deskripsi: '',
      tanggalMulai: todayStr,
      tanggalSelesai: todayStr,
      pegawaiIds: [],
      lokasiTipe: 'KANTOR',
      alamatLokasi: '',
      skipWeekends: true,
    },
  });

  const selectedPegawaiIds = watch('pegawaiIds') || [];
  const lokasiTipe = watch('lokasiTipe');

  const handleTogglePegawai = (pegawaiId: string) => {
    if (selectedPegawaiIds.includes(pegawaiId)) {
      setValue(
        'pegawaiIds',
        selectedPegawaiIds.filter((id) => id !== pegawaiId),
        { shouldValidate: true }
      );
    } else {
      setValue('pegawaiIds', [...selectedPegawaiIds, pegawaiId], {
        shouldValidate: true,
      });
    }
  };

  const handleSelectAllPegawai = () => {
    if (selectedPegawaiIds.length === pegawaiOptions.length) {
      setValue('pegawaiIds', [], { shouldValidate: true });
    } else {
      setValue(
        'pegawaiIds',
        pegawaiOptions.map((p) => p.id),
        { shouldValidate: true }
      );
    }
  };

  const onSubmit = async (data: CreateJadwalRangeInput) => {
    setIsSubmitting(true);
    try {
      const res = await createJadwalRangeAction(data);
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat jadwal penugasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Judul Penugasan"
        required
        error={errors.judul?.message}
      >
        <Input
          placeholder="Contoh: Piket Pelayanan Front Office PTSP"
          {...register('judul')}
        />
      </FormField>

      <FormField
        label="Deskripsi & Arahan Tugas"
        description="Rincian instruksi pelaksanaan tugas (opsional)"
        error={errors.deskripsi?.message}
      >
        <Textarea
          placeholder="Tuliskan arahan tugas atau catatan khusus untuk pegawai..."
          rows={3}
          {...register('deskripsi')}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Tanggal Mulai"
          required
          error={errors.tanggalMulai?.message}
        >
          <Input type="date" {...register('tanggalMulai')} />
        </FormField>

        <FormField
          label="Tanggal Selesai"
          required
          error={errors.tanggalSelesai?.message}
        >
          <Input type="date" {...register('tanggalSelesai')} />
        </FormField>
      </div>

      <div className="flex items-center justify-between p-3 rounded-panel border border-border bg-muted/40">
        <div>
          <div className="text-sm font-semibold text-text-primary">
            Lewati Akhir Pekan
          </div>
          <div className="text-xs text-text-secondary">
            Jangan buat jadwal pada hari Sabtu dan Minggu
          </div>
        </div>
        <Controller
          name="skipWeekends"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Lewati Akhir Pekan"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Tipe Lokasi"
          required
          error={errors.lokasiTipe?.message}
        >
          <Controller
            name="lokasiTipe"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOKET">Loket Pelayanan</SelectItem>
                  <SelectItem value="KECAMATAN">Layanan Kecamatan</SelectItem>
                  <SelectItem value="KANTOR">Kantor Dinas</SelectItem>
                  <SelectItem value="LAINNYA">Lainnya / Lapangan</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Alamat / Ruang Pelaksanaan"
          description={lokasiTipe === 'KANTOR' || lokasiTipe === 'LOKET' ? 'Contoh: Ruang Pelayanan Lantai 1 / Loket' : 'Contoh: Kantor Kecamatan Karawang Barat / Kawasan KIIC'}
          error={errors.alamatLokasi?.message}
        >
          <Input
            placeholder="Detail lokasi pelaksanaan tugas"
            {...register('alamatLokasi')}
          />
        </FormField>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-text-primary">
            Pilih Pegawai yang Ditugaskan
            <span className="ml-1 text-error">*</span>
          </label>
          <button
            type="button"
            onClick={handleSelectAllPegawai}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {selectedPegawaiIds.length === pegawaiOptions.length
              ? 'Batalkan Semua'
              : 'Pilih Semua Pegawai'}
          </button>
        </div>

        {errors.pegawaiIds && (
          <p className="text-xs text-error">{errors.pegawaiIds.message}</p>
        )}

        <div className="max-h-48 overflow-y-auto space-y-1 rounded-panel border border-border p-2 bg-surface">
          {pegawaiOptions.length === 0 ? (
            <p className="text-xs text-text-secondary p-2 text-center">
              Belum ada pegawai aktif yang terdaftar.
            </p>
          ) : (
            pegawaiOptions.map((pegawai) => {
              const isSelected = selectedPegawaiIds.includes(pegawai.id);
              return (
                <div
                  key={pegawai.id}
                  onClick={() => handleTogglePegawai(pegawai.id)}
                  className="flex items-center justify-between p-2 rounded-btn hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTogglePegawai(pegawai.id)}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {pegawai.name}
                    </span>
                    <span className="text-xs text-text-secondary">
                      @{pegawai.username}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-text-secondary">
                    {pegawai.bidang}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FormActions
        submitLabel="Buat Penugasan"
        cancelLabel="Batal"
        isLoading={isSubmitting}
        onCancel={onClose}
      />
    </form>
  );
}

export function JadwalFormDialog({
  open,
  onOpenChange,
  pegawaiOptions,
}: JadwalFormDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Buat Penugasan Jadwal Baru"
      description="Jadwal dapat dibuat untuk rentang hingga 31 hari sekaligus dan otomatis menugaskan beberapa pegawai."
      maxWidth="lg"
    >
      {open ? (
        <JadwalFormContent
          pegawaiOptions={pegawaiOptions}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Modal>
  );
}
