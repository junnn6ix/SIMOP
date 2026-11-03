import { z } from 'zod';

/**
 * Normalisasi nomor WhatsApp ke standar format internasional Indonesia:
 * Contoh: '08123456789' -> '628123456789'
 *         '+62 812-3456-789' -> '628123456789'
 *         '8123456789' -> '628123456789'
 */
export function normalizeWaNumber(val: string): string {
  if (!val) return '';
  // Hapus semua karakter non-digit
  let digits = val.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '628' + digits.slice(1);
  }

  return digits;
}

export const createPbgSchema = z.object({
  pemohon: z
    .string()
    .trim()
    .min(3, 'Nama pemohon minimal 3 karakter')
    .max(150, 'Nama pemohon maksimal 150 karakter'),
  noWa: z
    .string()
    .trim()
    .min(9, 'Nomor WhatsApp minimal 9 digit')
    .max(20, 'Nomor WhatsApp maksimal 20 karakter')
    .transform((val) => normalizeWaNumber(val))
    .refine(
      (val) => /^628\d{8,12}$/.test(val),
      'Nomor WhatsApp tidak valid (harus berupa nomor seluler Indonesia yang aktif, misal 0812...)'
    ),
  noSkrd: z
    .string()
    .trim()
    .min(3, 'Nomor SKRD minimal 3 karakter')
    .max(50, 'Nomor SKRD maksimal 50 karakter')
    .toUpperCase(),
  lokasi: z
    .string()
    .trim()
    .min(3, 'Lokasi proyek/bangunan minimal 3 karakter')
    .max(300, 'Lokasi maksimal 300 karakter'),
  nominal: z.coerce
    .number()
    .positive('Nominal retribusi PBG harus lebih besar dari 0')
    .max(10_000_000_000, 'Nominal retribusi maksimal Rp 10 Miliar'),
  jatuhTempo: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal jatuh tempo harus YYYY-MM-DD'),
});

export const updatePbgSchema = createPbgSchema.extend({
  id: z.string().min(1, 'ID tagihan PBG wajib diisi'),
});

export type CreatePbgInput = z.input<typeof createPbgSchema>;
export type CreatePbgParsed = z.output<typeof createPbgSchema>;
export type UpdatePbgInput = z.input<typeof updatePbgSchema>;
export type UpdatePbgParsed = z.output<typeof updatePbgSchema>;

