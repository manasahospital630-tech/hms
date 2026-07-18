import fs from 'fs';
import path from 'path';
import { query } from '../config/database';

const migrationsDir = path.join(__dirname, '../../database/migrations');

const runMigrations = async () => {
  console.log('🏁 Starting database migrations...');
  try {
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        console.log(`\n📄 Reading migration file: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf-8');
        
        console.log(`⚙️ Executing SQL from ${file}...`);
        await query(sql);
        console.log(`✅ Completed migration: ${file}`);
      }
    }
    console.log('\n🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message || error);
    process.exit(1);
  }
};

runMigrations();
