const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const seParameters = [
  { name: 'Sodium', unit: 'mmol/L', reference_range: '135–145', display_order: 1 },
  { name: 'Potassium', unit: 'mmol/L', reference_range: '3.5–5.1', display_order: 2 },
  { name: 'Chloride', unit: 'mmol/L', reference_range: '98–107', display_order: 3 }
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
    await seedTest('Serum Electrolytes (SE)', 'SE', 'Laboratory', 450, 'Blood', seParameters);
    await seedTest('Serum Electrolytes', 'ELECTROLYTES', 'Laboratory', 450, 'Blood', seParameters);
    console.log('ALL Serum Electrolytes parameters successfully seeded to Database!');
  } catch (err) {
    console.error('Error seeding Serum Electrolytes parameters:', err);
  } finally {
    await pool.end();
  }
}

run();
