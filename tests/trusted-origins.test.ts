import { describe, it, expect } from 'vitest';
import { formatOriginUrl, resolveTrustedOrigins } from '@/lib/auth';

describe('trustedOrigins formatting & validation', () => {
  it('formats domains without protocol into https:// URLs', () => {
    expect(formatOriginUrl('simop-dpmptsp.vercel.app')).toBe('https://simop-dpmptsp.vercel.app');
    expect(formatOriginUrl('simop.karawangkab.go.id')).toBe('https://simop.karawangkab.go.id');
  });

  it('preserves existing https:// and http:// protocols', () => {
    expect(formatOriginUrl('https://simop-custom.vercel.app')).toBe('https://simop-custom.vercel.app');
    expect(formatOriginUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('rejects invalid or empty domains', () => {
    expect(formatOriginUrl('')).toBeNull();
    expect(formatOriginUrl(null)).toBeNull();
    expect(formatOriginUrl('   ')).toBeNull();
    expect(formatOriginUrl('invalid :// url')).toBeNull();
  });

  it('correctly resolves trusted origins from environment variables', () => {
    const origins = resolveTrustedOrigins({
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      VERCEL_PROJECT_PRODUCTION_URL: 'simop-production.vercel.app',
      SIMOP_PREVIEW_DOMAIN: 'simop-preview-git-feature.vercel.app',
    });

    expect(origins).toContain('http://localhost:3000');
    expect(origins).toContain('https://simop-production.vercel.app');
    expect(origins).toContain('https://simop-preview-git-feature.vercel.app');
    // Ensure wildcard is not present
    expect(origins.some((o) => o.includes('*'))).toBe(false);
  });
});

