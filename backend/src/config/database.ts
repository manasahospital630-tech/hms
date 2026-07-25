import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './environment';

// Production Supabase Direct Port 5432 (Bypasses PgBouncer 6543 ECIRCUITBREAKER lockout)
const prodCloudDb5432 = 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

const sanitizeConnectionString = (connStr: string) => {
  if (!connStr || connStr.includes('localhost') || connStr.includes('127.0.0.1') || connStr.includes('postgres:postgres') || connStr.includes('hms_db')) {
    return prodCloudDb5432;
  }
  // FORCE replacement of PgBouncer Port 6543 (which throws ECIRCUITBREAKER) with Direct Session Port 5432
  return connStr.replace(':6543', ':5432');
};

const createPool = (connectionString: string) => {
  const finalUrl = sanitizeConnectionString(connectionString);
  const isLocal = finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1') || finalUrl.includes('sslmode=disable');
  return new Pool({
    connectionString: finalUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
};

let activePool = createPool(env.DATABASE_URL);
let fallbackPool: Pool | null = null;

activePool.on('error', (err: Error) => {
  console.error('Unexpected error on primary database client:', err.message);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await activePool.query<T>(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
    }
    return result;
  } catch (error: any) {
    const errMsg = error?.message || '';
    const errCode = error?.code || '';

    // If active pool fails due to auth failure, circuit breaker lockout, or bad connection
    if (
      errMsg.includes('password authentication failed') ||
      errMsg.includes('ECIRCUITBREAKER') ||
      errMsg.includes('too many authentication failures') ||
      errMsg.includes('ECONNREFUSED') ||
      errCode === '28P01' ||
      errCode === 'ECONNREFUSED'
    ) {
      console.warn('Primary DB pool error encountered (' + errMsg + '). Automatically retrying on Direct Cloud Database Pool (Port 5432)...');
      if (!fallbackPool) {
        fallbackPool = createPool(prodCloudDb5432);
        fallbackPool.on('error', (e) => console.error('Unexpected error on fallback pool:', e.message));
      }
      const result = await fallbackPool.query<T>(text, params);
      return result;
    }
    throw error;
  }
};

export const getClient = async () => {
  try {
    const client = await activePool.connect();
    return client;
  } catch (error: any) {
    const errMsg = error?.message || '';
    if (errMsg.includes('password authentication failed') || errMsg.includes('ECIRCUITBREAKER') || error?.code === '28P01') {
      if (!fallbackPool) {
        fallbackPool = createPool(prodCloudDb5432);
      }
      return await fallbackPool.connect();
    }
    throw error;
  }
};

export default activePool;
