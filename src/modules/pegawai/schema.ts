import { z } from 'zod';

export const createPegawaiSchema = z.object({
  name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(100),
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(50)
    .regex(/^[a-z0-9_.-]+$/, 'Username hanya boleh huruf kecil, angka, garis bawah, titik, dan strip'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  bidang: z.enum(['SEKRETARIAT', 'PTSP', 'PM', 'PENGAWASAN'], {
    errorMap: () => ({ message: 'Pilih bidang yang valid' }),
  }),
  nip: z.string().trim().max(30).optional().nullable(),
});

export const updatePegawaiSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(100),
  bidang: z.enum(['SEKRETARIAT', 'PTSP', 'PM', 'PENGAWASAN']),
  nip: z.string().trim().max(30).optional().nullable(),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

export type CreatePegawaiInput = z.infer<typeof createPegawaiSchema>;
export type UpdatePegawaiInput = z.infer<typeof updatePegawaiSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

