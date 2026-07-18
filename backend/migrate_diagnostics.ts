import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from './src/config/environment';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Starting Diagnostics module migrations...');

    // 1. Run migrations SQL
    const sqlPath = path.join(__dirname, 'database', 'migrations', '009_diagnostics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running migration: 009_diagnostics.sql');
    await pool.query(sql);
    console.log('Table structures created successfully.');

    // 2. Seed Initial Categories
    console.log('Seeding diagnostic categories...');
    const catInsert = `
      INSERT INTO diagnostic_categories (name, description) VALUES
      ('Laboratory', 'In-house blood, urine, stool pathology and biochemistry laboratory analyses'),
      ('Radiology', 'X-Ray, CT scans, and MRI scans radiography services'),
      ('Ultrasound', 'Pelvis, obstetric, anomaly, and abdominal ultrasound imaging scan services'),
      ('Cardiology Diagnostics', 'Electrocardiogram, 2D echocardiograms, and treadmill testing services'),
      ('Neurology Diagnostics', 'Electroencephalograms and nerve conduction examinations')
      ON CONFLICT (name) DO NOTHING;
    `;
    await pool.query(catInsert);

    // Retrieve categories map
    const catRes = await pool.query('SELECT category_id, name FROM diagnostic_categories');
    const catMap: Record<string, string> = {};
    catRes.rows.forEach(r => {
      catMap[r.name] = r.category_id;
    });

    // 3. Seed Initial Services
    console.log('Seeding diagnostic services...');
    const services = [
      { name: 'Complete Blood Count (CBC)', cat: 'Laboratory', code: 'CBC', price: 1200.00, range: 'Hb: 12-16 g/dL, WBC: 4000-11000/mcL, Platelets: 1.5-4.5L/mcL', sample: 'Blood' },
      { name: 'Thyroid Profile (T3, T4, TSH)', cat: 'Laboratory', code: 'THYROID', price: 1800.00, range: 'TSH: 0.45 - 4.5 uIU/mL', sample: 'Blood' },
      { name: 'Blood Glucose Fasting', cat: 'Laboratory', code: 'GLUCOSE_F', price: 350.00, range: 'Fasting: 70-100 mg/dL', sample: 'Blood' },
      { name: 'Chest X-Ray (PA View)', cat: 'Radiology', code: 'XRAY_CHEST', price: 1500.00, range: 'Normal Lung Fields & Cardiothoracic Ratio', sample: 'None' },
      { name: 'Abdomen & Pelvis Ultrasound', cat: 'Ultrasound', code: 'USG_ABD_PEL', price: 2800.00, range: 'Normal structural anatomy of abdominal viscera', sample: 'None' },
      { name: '12-Lead Electrocardiogram (ECG)', cat: 'Cardiology Diagnostics', code: 'ECG_12', price: 800.00, range: 'Normal Sinus Rhythm', sample: 'None' }
    ];

    for (const s of services) {
      const catId = catMap[s.cat];
      if (catId) {
        await pool.query(`
          INSERT INTO diagnostic_services (name, category_id, service_code, price, gst_percentage, duration_minutes, sample_required, normal_range, machine_required)
          VALUES ($1, $2, $3, $4, 18.00, 20, $5, $6, 'Auto')
          ON CONFLICT (service_code) DO NOTHING;
        `, [s.name, catId, s.code, s.price, s.sample, s.range]);
      }
    }

    // 4. Seed Referral Doctor
    console.log('Seeding referral doctors...');
    await pool.query(`
      INSERT INTO referral_doctors (name, hospital, commission_percentage, phone, email)
      VALUES ('Dr. Aditi Sharma', 'AIMS Heart & Lung Center', 15.00, '9876543210', 'aditi.sharma@aims.org')
      ON CONFLICT DO NOTHING;
    `);

    // 5. Seed Initial Equipment Machines
    console.log('Seeding machines...');
    await pool.query(`
      INSERT INTO machines (name, manufacturer, model, serial_number, calibration_date, maintenance_date, department, status)
      VALUES 
      ('Sysmex XN-1000 Hematology Analyzer', 'Sysmex Corporation', 'XN-1000', 'SYS-XN-10001', CURRENT_DATE - 30, CURRENT_DATE + 335, 'Laboratory', 'Active'),
      ('Siemens Multix Impact X-Ray', 'Siemens Healthineers', 'Impact PA', 'SIE-XR-20092', CURRENT_DATE - 15, CURRENT_DATE + 165, 'Radiology', 'Active'),
      ('GE Voluson E10 Ultrasound', 'GE Healthcare', 'Voluson E10', 'GE-USG-77810', CURRENT_DATE - 45, CURRENT_DATE + 135, 'Ultrasound', 'Active')
      ON CONFLICT (serial_number) DO NOTHING;
    `);

    console.log('Diagnostics migration & seeding completed successfully.');
  } catch (error) {
    console.error('Diagnostics migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
