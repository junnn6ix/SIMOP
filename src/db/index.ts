import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '@/lib/env';

declare global {
  var _pgPool: Pool | undefined;
}

const isVercel = Boolean(process.env.VERCEL);
const isProd = process.env.NODE_ENV === 'production';
const isPlaywright = !isVercel && !isProd && process.env.PLAYWRIGHT === 'true';

const targetDbUrl =
  isPlaywright && process.env.DATABASE_URL_TEST
    ? process.env.DATABASE_URL_TEST
    : env.DATABASE_URL;

const isLocalhost =
  targetDbUrl.includes('localhost') ||
  targetDbUrl.includes('127.0.0.1');

const pool =
  globalThis._pgPool ||
  new Pool({
    connectionString: targetDbUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    ssl: isLocalhost ? false : true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._pgPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
export type Database = typeof db;

export function createTestDb(testConnectionString?: string) {
  const conn =
    testConnectionString ||
    process.env.DATABASE_URL_TEST ||
    env.DATABASE_URL_TEST;
  if (!conn) {
    throw new Error('DATABASE_URL_TEST tidak didefinisikan.');
  }

  const mainUrl = process.env.DATABASE_URL || env.DATABASE_URL;
  if (mainUrl && conn.trim() === mainUrl.trim()) {
    throw new Error(
      'DATABASE_URL_TEST tidak boleh sama dengan DATABASE_URL produksi/development demi integritas data.'
    );
  }

  const isLocal = conn.includes('localhost') || conn.includes('127.0.0.1');
  const testPool = new Pool({
    connectionString: conn,
    max: 5,
    ssl: isLocal ? false : true,
  });
  return {
    testDb: drizzle(testPool, { schema }),
    testPool,
  };
}
