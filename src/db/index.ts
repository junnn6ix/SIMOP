import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '@/lib/env';

declare global {
  var _pgPool: Pool | undefined;
}

const isLocalhost =
  env.DATABASE_URL.includes('localhost') ||
  env.DATABASE_URL.includes('127.0.0.1');

const pool =
  globalThis._pgPool ||
  new Pool({
    connectionString: env.DATABASE_URL,
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
