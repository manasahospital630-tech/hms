import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from './src/config/environment';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, 'database', 'migrations', '008_ip_admissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running migration: 008_ip_admissions.sql');
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
