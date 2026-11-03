import { z } from 'zod';

export const createJadwalRangeSchema = z.object({
  judul: z.string().trim().min(3, 'Judul tugas minimal 3 karakter').max(150),
  deskripsi: z.string().trim().max(500).optional().nullable(),
  tanggalMulai: z.string().min(1, 'Tanggal mulai wajib dipilih'),
  tanggalSelesai: z.string().min(1, 'Tanggal selesai wajib dipilih'),
  pegawaiIds: z
    .array(z.string().min(1))
    .min(1, 'Pilih minimal satu pegawai untuk penugasan'),
  lokasiTipe: z.enum(['DALAM_KANTOR', 'LUAR_KANTOR'], {
    errorMap: () => ({ message: 'Pilih lokasi penugasan yang valid' }),
  }),
  alamatLokasi: z.string().trim().max(255).optional().nullable(),
  skipWeekends: z.boolean().default(true),
});

export const submitLaporanSchema = z.object({
  jadwalId: z.string().min(1, 'ID jadwal wajib diisi'),
  buktiKey: z.string().min(1, 'Foto bukti tugas wajib diunggah'),
  pdfKey: z.string().optional().nullable(),
  laporanTeks: z.string().trim().max(1000, 'Catatan laporan maksimal 1000 karakter').optional().nullable(),
});

export type CreateJadwalRangeInput = z.infer<typeof createJadwalRangeSchema>;
export type SubmitLaporanInput = z.infer<typeof submitLaporanSchema>;

