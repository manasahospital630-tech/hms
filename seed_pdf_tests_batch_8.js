const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'HIV 1 & 2 Antibodies',
    code: 'HIV1-2',
    category: 'Laboratory',
    price: 450,
    sample: 'Serum',
    parameters: [
      { name: 'HIV 1 Antibody', unit: '', reference_range: 'Non-Reactive', display_order: 1 },
      { name: 'HIV 2 Antibody', unit: '', reference_range: 'Non-Reactive', display_order: 2 }
    ]
  },
  {
    name: 'Syphilis Screening (VDRL/RPR)',
    code: 'SYPHILIS',
    category: 'Laboratory',
    price: 350,
    sample: 'Serum',
    parameters: [
      { name: 'VDRL', unit: '', reference_range: 'Non-Reactive', display_order: 1 },
      { name: 'RPR', unit: '', reference_range: 'Non-Reactive', display_order: 2 }
    ]
  },
  {
    name: 'HPLC Hemoglobin Electrophoresis',
    code: 'HPLC',
    category: 'Laboratory',
    price: 1500,
    sample: 'EDTA Whole Blood',
    parameters: [
      { name: 'HbA', unit: '%', reference_range: '95-98', display_order: 1 },
      { name: 'HbA2', unit: '%', reference_range: '2.0-3.5', display_order: 2 },
      { name: 'HbF', unit: '%', reference_range: '<1.0', display_order: 3 },
      { name: 'HbS', unit: '%', reference_range: 'Absent', display_order: 4 },
      { name: 'HbD/HbE/Other Variants', unit: '%', reference_range: 'Absent', display_order: 5 }
    ]
  },
  {
    name: 'Rubella IgG Antibodies',
    code: 'RUBELLA_IGG',
    category: 'Laboratory',
    price: 600,
    sample: 'Serum',
    parameters: [
      { name: 'Rubella IgG Antibody', unit: 'IU/mL', reference_range: '>=10 Immune', display_order: 1 }
    ]
  }
];

async function seedTestItem(test) {
  console.log(`Seeding service: ${test.name} (${test.code})...`);

  let catRes = await pool.query(`SELECT category_id FROM diagnostic_categories WHERE LOWER(name) = LOWER($1) LIMIT 1`, [test.category]);
  let catId = catRes.rows[0]?.category_id;
  if (!catId) {
    const newCat = await pool.query(`INSERT INTO diagnostic_categories (name, description) VALUES ($1, $2) RETURNING category_id`, [test.category, test.category]);
    catId = newCat.rows[0].category_id;
  }

  // Find strictly by service code first
  let svcRes = await pool.query(
    `SELECT service_id FROM diagnostic_services WHERE LOWER(service_code) = LOWER($1) LIMIT 1`,
    [test.code]
  );

  if (svcRes.rows.length === 0) {
    svcRes = await pool.query(
      `SELECT service_id FROM diagnostic_services WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [test.name]
    );
  }

  let serviceId;
  if (svcRes.rows.length === 0) {
    const newSvc = await pool.query(
      `INSERT INTO diagnostic_services (name, service_code, category_id, price, sample_required, normal_range, is_active)
       VALUES ($1, $2, $3, $4, $5, 'See parameters', true)
       RETURNING service_id`,
      [test.name, test.code, catId, test.price, test.sample]
    );
    serviceId = newSvc.rows[0].service_id;
    console.log(`Created service "${test.name}" (ID: ${serviceId})`);
  } else {
    serviceId = svcRes.rows[0].service_id;
    await pool.query(
      `UPDATE diagnostic_services SET name = $1, service_code = $2, category_id = $3, price = $4, sample_required = $5 WHERE service_id = $6`,
      [test.name, test.code, catId, test.price, test.sample, serviceId]
    );
    console.log(`Updated service "${test.name}" (ID: ${serviceId})`);
  }

  // Clear and re-insert parameters
  await pool.query(`DELETE FROM diagnostic_parameters WHERE service_id = $1`, [serviceId]);

  for (const p of test.parameters) {
    await pool.query(
      `INSERT INTO diagnostic_parameters (service_id, name, unit, reference_range, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [serviceId, p.name, p.unit, p.reference_range, p.display_order]
    );
  }

  console.log(`Successfully configured ${test.parameters.length} parameters for ${test.name}.\n`);
}

async function run() {
  try {
    for (const test of testsToSeed) {
      await seedTestItem(test);
    }
    console.log('ALL 4 PDF BATCH 8 LABORATORY TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 8 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
