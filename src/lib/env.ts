import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET wajib diisi'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  R2_ACCOUNT_ID: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET_NAME: z.string().optional().default('simop-bucket'),
  R2_PUBLIC_DOMAIN: z.string().optional().default(''),
  FONNTE_TOKEN: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const isServer = typeof window === 'undefined';

function validateEnv() {
  if (!isServer) {
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    } as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Environment variables tidak valid:', parsed.error.format());
    }
    // In dev or test environments, supply sensible fallbacks to allow builds and tests to proceed
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_ENV_VALIDATION === '1') {
      return {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock',
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'test-secret-at-least-32-characters-long',
        BETTER_AUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        R2_ACCOUNT_ID: '',
        R2_ACCESS_KEY_ID: '',
        R2_SECRET_ACCESS_KEY: '',
        R2_BUCKET_NAME: 'simop-bucket',
        R2_PUBLIC_DOMAIN: '',
        FONNTE_TOKEN: '',
        CRON_SECRET: 'test-cron-secret',
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
      } as z.infer<typeof envSchema>;
    }
    throw new Error('Konfigurasi environment variable tidak lengkap.');
  }

  return parsed.data;
}

export const env = validateEnv();

