import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Attempt to load .env from multiple potential locations for cloud/Hostinger compatibility
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '.env')
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
dotenv.config();

// Direct Supabase Production Database URL (Port 5432 avoids PgBouncer ECIRCUITBREAKER lockouts)
const prodCloudDb = 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
const defaultJwt = 'super-secret-jwt-key-for-manasa-hms-production-2026';

let rawDbUrl = process.env.DATABASE_URL;

if (!rawDbUrl) {
  const user = process.env.DB_USER || process.env.POSTGRES_USER || process.env.PGUSER;
  const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.DB_PASS;
  const host = process.env.DB_HOST || process.env.POSTGRES_HOST || process.env.PGHOST;
  const port = process.env.DB_PORT || process.env.POSTGRES_PORT || process.env.PGPORT || '5432';
  const name = process.env.DB_NAME || process.env.POSTGRES_DB || process.env.PGDATABASE || 'postgres';

  if (user && password && host) {
    rawDbUrl = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
  }
}

// If DATABASE_URL is missing, or is set to generic broken localhost/postgres:postgres string, ALWAYS default to Direct Cloud DB (Port 5432)
if (!rawDbUrl || rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1') || rawDbUrl.includes('postgres:postgres') || rawDbUrl.includes('hms_db')) {
  rawDbUrl = prodCloudDb;
}

let rawPort: any = process.env.PORT || 5000;
if (typeof rawPort === 'string' && !isNaN(parseInt(rawPort, 10)) && !rawPort.includes('/') && !rawPort.includes('\\')) {
  rawPort = parseInt(rawPort, 10);
}

export const env = {
  PORT: rawPort,
  DATABASE_URL: rawDbUrl,
  JWT_SECRET: process.env.JWT_SECRET || defaultJwt,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'production',
};
