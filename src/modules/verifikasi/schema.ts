import { z } from 'zod';

export const verifikasiActionSchema = z
  .object({
    jadwalId: z.string().min(1, 'ID jadwal wajib diisi'),
    decision: z.enum(['ACC', 'TOLAK'], {
      errorMap: () => ({ message: 'Keputusan verifikasi harus berupa ACC atau TOLAK' }),
    }),
    catatanVerifikator: z
      .string()
      .trim()
      .max(1000, 'Catatan verifikator maksimal 1000 karakter')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'TOLAK' && (!data.catatanVerifikator || data.catatanVerifikator.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['catatanVerifikator'],
        message: 'Catatan alasan penolakan wajib diisi (minimal 5 karakter) agar pegawai dapat memperbaiki laporan.',
      });
    }
  });

export type VerifikasiActionInput = z.infer<typeof verifikasiActionSchema>;

