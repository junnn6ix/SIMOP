import { betterAuth } from 'better-auth';
import { username, admin } from 'better-auth/plugins';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import { user, session, account, verification, rateLimit } from '@/db/schema/auth';
import { env } from '@/lib/env';

/**
 * Memformat dan memvalidasi URL domain asal.
 * Menambahkan protokol https:// jika belum ada, serta memvalidasi hostname.
 */
export function formatOriginUrl(domainOrUrl?: string | null): string | null {
  if (!domainOrUrl) return null;
  const trimmed = domainOrUrl.trim();
  if (!trimmed) return null;

  let urlWithProtocol = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    urlWithProtocol = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(urlWithProtocol);
    if (!parsed.hostname || parsed.hostname.length < 3) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Daftar domain asal tepercaya (trustedOrigins).
 * Wildcard dihapus; domain dibaca spesifik dari environment produksi/preview.
 */
export function resolveTrustedOrigins(customEnv?: {
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  SIMOP_PREVIEW_DOMAIN?: string;
  NODE_ENV?: string;
  VERCEL?: string;
}): string[] {
  const currentEnv = customEnv || process.env;
  const isVercel = Boolean(currentEnv.VERCEL ?? process.env.VERCEL);
  const isProd = (currentEnv.NODE_ENV ?? process.env.NODE_ENV) === 'production';

  // Origins localhost hanya diizinkan di lingkungan lokal/development non-Vercel
  const origins: string[] = (!isVercel && !isProd)
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
    : [];

  const appUrl = formatOriginUrl(currentEnv.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL);
  if (appUrl) origins.push(appUrl);

  const vercelProd = formatOriginUrl(currentEnv.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProd) origins.push(vercelProd);

  const simopPreview = formatOriginUrl(currentEnv.SIMOP_PREVIEW_DOMAIN);
  if (simopPreview) origins.push(simopPreview);

  return Array.from(new Set(origins));
}

/**
 * Factory konfigurasi Better Auth bersama.
 * Digunakan baik oleh runtime produksi maupun test suite agar selalu sinkron 100%.
 */
export function createAuthOptions(databaseAdapter: any, overrides: Record<string, any> = {}) {
  return {
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: env.BETTER_AUTH_SECRET,
    database: databaseAdapter,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    rateLimit: {
      enabled: true,
      storage: 'database' as const,
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/username': {
          window: 60,
          max: 10, // Batas login 10 percobaan per menit per IP
        },
        '/sign-in/email': {
          window: 60,
          max: 10,
        },
      },
    },
    advanced: {
      ipAddress: {
        // Prioritaskan x-real-ip untuk Vercel proxy, lalu fallback ke x-forwarded-for
        ipAddressHeaders: ['x-real-ip', 'x-forwarded-for'],
      },
    },
    trustedOrigins: resolveTrustedOrigins(),
    plugins: [
      username(),
      admin({
        adminRoles: ['ADMIN'],
        defaultRole: 'PEGAWAI',
        roles: {
          ADMIN: adminAc,
          PEGAWAI: userAc,
        },
      }),
    ],
    user: {
      additionalFields: {
        nip: {
          type: 'string' as const,
          required: false,
          input: true,
        },
        bidang: {
          type: 'string' as const,
          required: true,
          input: false,
        },
        aktif: {
          type: 'boolean' as const,
          required: true,
          defaultValue: true,
          input: false,
        },
        role: {
          type: 'string' as const,
          required: false,
          defaultValue: 'PEGAWAI',
          input: false,
        },
      },
    },
    ...overrides,
  };
}

export const auth = betterAuth(
  createAuthOptions(
    drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user,
        session,
        account,
        verification,
        rateLimit,
      },
    })
  )
);

/**
 * Generator alamat email internal sintetis untuk pengguna SIMOP.
 * Pengguna tidak memiliki email eksternal riil; autentikasi menggunakan username.
 */
export function getSyntheticEmail(rawUsername: string): string {
  const sanitized = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${sanitized}@simop.local`;
}

export type Auth = typeof auth;
export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
