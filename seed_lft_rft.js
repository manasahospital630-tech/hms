const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const rftParameters = [
  { name: 'Blood Urea', unit: 'mg/dL', reference_range: '15–40', display_order: 1 },
  { name: 'Serum Creatinine', unit: 'mg/dL', reference_range: '0.7–1.3', display_order: 2 },
  { name: 'BUN', unit: 'mg/dL', reference_range: '7–20', display_order: 3 },
  { name: 'Uric Acid', unit: 'mg/dL', reference_range: '3.4–7.0', display_order: 4 },
  { name: 'Sodium', unit: 'mmol/L', reference_range: '135–145', display_order: 5 },
  { name: 'Potassium', unit: 'mmol/L', reference_range: '3.5–5.1', display_order: 6 },
  { name: 'Chloride', unit: 'mmol/L', reference_range: '98–107', display_order: 7 },
  { name: 'Bicarbonate', unit: 'mmol/L', reference_range: '22–29', display_order: 8 },
  { name: 'Calcium', unit: 'mg/dL', reference_range: '8.5–10.5', display_order: 9 },
  { name: 'Phosphorus', unit: 'mg/dL', reference_range: '2.5–4.5', display_order: 10 },
  { name: 'eGFR', unit: 'mL/min/1.73m²', reference_range: '≥90', display_order: 11 }
];

const lftParameters = [
  { name: 'Total Bilirubin', unit: 'mg/dL', reference_range: '0.3–1.2', display_order: 1 },
  { name: 'Direct Bilirubin', unit: 'mg/dL', reference_range: '0.0–0.3', display_order: 2 },
  { name: 'Indirect Bilirubin', unit: 'mg/dL', reference_range: '0.2–0.9', display_order: 3 },
  { name: 'AST (SGOT)', unit: 'U/L', reference_range: '10–40', display_order: 4 },
  { name: 'ALT (SGPT)', unit: 'U/L', reference_range: '7–56', display_order: 5 },
  { name: 'ALP', unit: 'U/L', reference_range: '44–147', display_order: 6 },
  { name: 'Total Protein', unit: 'g/dL', reference_range: '6.4–8.3', display_order: 7 },
  { name: 'Albumin', unit: 'g/dL', reference_range: '3.5–5.2', display_order: 8 },
  { name: 'Globulin', unit: 'g/dL', reference_range: '2.0–3.5', display_order: 9 },
  { name: 'A/G Ratio', unit: 'Ratio', reference_range: '1.0–2.2', display_order: 10 }
];

async function seedTest(serviceName, serviceCode, categoryName, price, sampleReq, params) {
  console.log(`Processing service: ${serviceName} (${serviceCode})...`);
  
  let catRes = await pool.query(`SELECT category_id FROM diagnostic_categories WHERE name = $1 LIMIT 1`, [categoryName]);
  let catId = catRes.rows[0]?.category_id;
  if (!catId) {
    const newCat = await pool.query(`INSERT INTO diagnostic_categories (name, description) VALUES ($1, $2) RETURNING category_id`, [categoryName, categoryName]);
    catId = newCat.rows[0].category_id;
  }

  let svcRes = await pool.query(
    `SELECT service_id FROM diagnostic_services 
     WHERE LOWER(service_code) = LOWER($1) OR LOWER(name) LIKE $2 LIMIT 1`,
    [serviceCode, `%${serviceName.toLowerCase()}%`]
  );

  let serviceId;
  if (svcRes.rows.length === 0) {
    const newSvc = await pool.query(
      `INSERT INTO diagnostic_services (name, service_code, category_id, price, sample_required, normal_range, is_active)
       VALUES ($1, $2, $3, $4, $5, 'See parameters', true)
       RETURNING service_id`,
      [serviceName, serviceCode, catId, price, sampleReq]
    );
    serviceId = newSvc.rows[0].service_id;
    console.log(`Created new service ${serviceName} with ID: ${serviceId}`);
  } else {
    serviceId = svcRes.rows[0].service_id;
    console.log(`Found existing service ${serviceName} with ID: ${serviceId}`);
  }

  // Delete old parameters for clean replacement
  await pool.query(`DELETE FROM diagnostic_parameters WHERE service_id = $1`, [serviceId]);

  // Insert parameters
  for (const p of params) {
    await pool.query(
      `INSERT INTO diagnostic_parameters (service_id, name, unit, reference_range, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [serviceId, p.name, p.unit, p.reference_range, p.display_order]
    );
  }

  console.log(`Successfully seeded ${params.length} parameters for ${serviceName}.`);
}

async function run() {
  try {
    await seedTest('Renal Function Test (RFT)', 'RFT', 'Laboratory', 600, 'Blood', rftParameters);
    await seedTest('Kidney Function Test (KFT)', 'KFT', 'Laboratory', 600, 'Blood', rftParameters);
    await seedTest('Liver Function Test (LFT)', 'LFT', 'Laboratory', 650, 'Blood', lftParameters);
    console.log('ALL LFT and RFT parameters successfully seeded to Database!');
  } catch (err) {
    console.error('Error seeding LFT/RFT parameters:', err);
  } finally {
    await pool.end();
  }
}

run();
