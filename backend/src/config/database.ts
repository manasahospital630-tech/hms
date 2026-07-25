import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './environment';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle database client:', err.message);
  // Do NOT execute process.exit() here to keep server running on Hostinger/Cloud hosting
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
  }
  return result;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
