import { z } from 'zod';

export const createBarangSchema = z.object({
  nama: z.string().trim().min(2, 'Nama barang minimal 2 karakter').max(150),
  kodeBarang: z.string().trim().max(50).optional().nullable(),
  kategori: z.enum(['ATK', 'ASET'], {
    errorMap: () => ({ message: 'Pilih kategori yang valid (ATK atau ASET)' }),
  }),
  stok: z.coerce.number().int().min(0, 'Stok awal tidak boleh negatif').default(0),
  limitStok: z.coerce.number().int().min(0, 'Limit stok minimal 0').default(5),
  satuan: z.string().trim().min(1, 'Satuan wajib diisi').max(30).default('Pcs'),
  deskripsi: z.string().trim().max(500).optional().nullable(),
  fotoUrl: z.string().url('URL foto tidak valid').optional().nullable(),
});

export const updateBarangSchema = z.object({
  id: z.string().min(1),
  nama: z.string().trim().min(2, 'Nama barang minimal 2 karakter').max(150),
  kategori: z.enum(['ATK', 'ASET']),
  limitStok: z.coerce.number().int().min(0, 'Limit stok minimal 0').default(5),
  satuan: z.string().trim().min(1, 'Satuan wajib diisi').max(30).default('Pcs'),
  deskripsi: z.string().trim().max(500).optional().nullable(),
  fotoUrl: z.string().url('URL foto tidak valid').optional().nullable(),
});

export const adjustStokSchema = z.object({
  barangId: z.string().min(1, 'ID barang wajib diisi'),
  tipe: z.enum(['MASUK', 'KELUAR'], {
    errorMap: () => ({ message: 'Tipe mutasi stok harus MASUK atau KELUAR' }),
  }),
  jumlah: z.coerce.number().int().min(1, 'Jumlah mutasi stok minimal 1'),
  keterangan: z.string().trim().min(3, 'Keterangan mutasi minimal 3 karakter').max(255),
});

export type CreateBarangInput = z.infer<typeof createBarangSchema>;
export type UpdateBarangInput = z.infer<typeof updateBarangSchema>;
export type AdjustStokInput = z.infer<typeof adjustStokSchema>;

