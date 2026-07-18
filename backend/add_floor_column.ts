import { Pool } from 'pg';
import { env } from './src/config/environment';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function addFloorColumn() {
  try {
    console.log('Altering hospital_beds table to add floor column...');
    await pool.query(`
      ALTER TABLE hospital_beds 
      ADD COLUMN IF NOT EXISTS floor VARCHAR(50) DEFAULT '1st Floor';
    `);
    console.log('Successfully added floor column to hospital_beds table.');
  } catch (error) {
    console.error('Failed to add floor column:', error);
  } finally {
    await pool.end();
  }
}

addFloorColumn();
