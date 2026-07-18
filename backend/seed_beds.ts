import { Pool } from 'pg';
import { env } from './src/config/environment';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function seedBeds() {
  try {
    const beds = [
      { num: 'E-01', ward: 'Emergency Observation Ward', type: 'Emergency', charge: 5000 },
      { num: 'E-02', ward: 'Emergency Observation Ward', type: 'Emergency', charge: 5000 },
      { num: 'ICU-1', ward: 'Intensive Care Unit (ICU)', type: 'ICU', charge: 15000 },
      { num: 'ICU-2', ward: 'Intensive Care Unit (ICU)', type: 'ICU', charge: 15000 },
      { num: 'GW-101', ward: 'General Medical Ward', type: 'General_Ward', charge: 2000 },
      { num: 'GW-102', ward: 'General Medical Ward', type: 'General_Ward', charge: 2000 },
    ];

    for (const b of beds) {
      await pool.query(
        "INSERT INTO hospital_beds (bed_number, ward_name, type, per_day_charge, status) VALUES ($1, $2, $3, $4, 'Available') ON CONFLICT DO NOTHING",
        [b.num, b.ward, b.type, b.charge]
      );
    }
    console.log('Beds seeded.');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

seedBeds();
