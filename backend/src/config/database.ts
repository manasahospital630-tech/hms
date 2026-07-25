import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './environment';

const prodCloudDb = 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const createPool = (connectionString: string) => {
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1') || connectionString.includes('sslmode=disable');
  return new Pool({
    connectionString,
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

    // If primary pool connection fails due to invalid password, auth error (28P01), or connection refused on localhost
    if (
      errMsg.includes('password authentication failed') ||
      errMsg.includes('ECONNREFUSED') ||
      errCode === '28P01' ||
      errCode === 'ECONNREFUSED'
    ) {
      console.warn('Primary DB connection failed. Automatically falling back to Production Cloud Database pool...');
      if (!fallbackPool) {
        fallbackPool = createPool(prodCloudDb);
        fallbackPool.on('error', (e) => console.error('Unexpected error on fallback database pool:', e.message));
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
    if (errMsg.includes('password authentication failed') || error?.code === '28P01') {
      if (!fallbackPool) {
        fallbackPool = createPool(prodCloudDb);
      }
      return await fallbackPool.connect();
    }
    throw error;
  }
};

export default activePool;
