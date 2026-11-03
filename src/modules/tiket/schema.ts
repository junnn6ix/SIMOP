import { z } from 'zod';

export const createTiketSchema = z.object({
  barangId: z.string().min(1, 'Pilih barang yang diajukan'),
  jenis: z.enum(['PERMINTAAN_BARANG', 'LAPOR_KERUSAKAN'], {
    errorMap: () => ({ message: 'Pilih jenis layanan tiket yang valid' }),
  }),
  jumlah: z.coerce.number().int().min(1, 'Jumlah minimal 1').default(1),
  keperluan: z.string().trim().min(5, 'Keterangan/keperluan minimal 5 karakter').max(500),
});

export const updateTiketStatusSchema = z.object({
  tiketId: z.string().min(1, 'ID tiket wajib diisi'),
  status: z.enum(['ACC', 'MAINTENANCE', 'DITOLAK', 'SELESAI'], {
    errorMap: () => ({ message: 'Status tiket tidak valid' }),
  }),
  catatanAdmin: z.string().trim().max(500).optional().nullable(),
});

export type CreateTiketInput = z.infer<typeof createTiketSchema>;
export type UpdateTiketStatusInput = z.infer<typeof updateTiketStatusSchema>;

