import type { NextConfig } from 'next';
import * as fs from 'fs';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const r2AccountId = process.env.R2_ACCOUNT_ID || '';
const r2BucketName = process.env.R2_BUCKET_NAME || '';

const r2ExactHost = r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : '';
const r2BucketHost =
  r2AccountId && r2BucketName
    ? `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com`
    : '';

const r2Endpoints = [r2ExactHost, r2BucketHost].filter(Boolean).join(' ');

const isProd = process.env.NODE_ENV === 'production';
const scriptSrc = isProd
  ? "'self' 'unsafe-inline'"
  : "'self' 'unsafe-eval' 'unsafe-inline'";

const cspHeader = `
  default-src 'self';
  script-src ${scriptSrc};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com data:;
  img-src 'self' data: blob: ${r2Endpoints};
  connect-src 'self' ${r2Endpoints};
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
