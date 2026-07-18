import { Pool } from 'pg';
import { env } from './src/config/environment';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function alterInvoiceStatus() {
  try {
    console.log("Altering invoice_status type to add 'Cancelled' and 'Returned'...");
    
    // We run them separately outside transactions since ALTER TYPE ADD VALUE cannot run inside transactions.
    await pool.query(`ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'Cancelled';`);
    await pool.query(`ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'Returned';`);
    
    console.log("Successfully altered invoice_status PG enum type.");
  } catch (error) {
    console.error("Failed to alter invoice_status enum:", error);
  } finally {
    await pool.end();
  }
}

alterInvoiceStatus();
