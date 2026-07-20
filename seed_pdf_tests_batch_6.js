const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'Tn-T - Troponin-T',
    code: 'Tn-T',
    category: 'Laboratory',
    price: 1100,
    sample: 'Serum',
    parameters: [
      { name: 'Troponin-T', unit: 'ng/L', reference_range: '<14', display_order: 1 }
    ]
  },
  {
    name: 'Tn-I - Troponin-I',
    code: 'Tn-I',
    category: 'Laboratory',
    price: 1100,
    sample: 'Serum',
    parameters: [
      { name: 'Troponin-I', unit: 'ng/L', reference_range: '<34 (Male), <16 (Female)', display_order: 1 }
    ]
  },
  {
    name: 'TG - Triglycerides',
    code: 'TG',
    category: 'Laboratory',
    price: 200,
    sample: 'Serum',
    parameters: [
      { name: 'Triglycerides', unit: 'mg/dL', reference_range: '<150', display_order: 1 }
    ]
  },
  {
    name: 'TT - Total Testosterone',
    code: 'TT',
    category: 'Laboratory',
    price: 600,
    sample: 'Serum',
    parameters: [
      { name: 'Total Testosterone', unit: 'ng/dL', reference_range: 'Male:300-1000', display_order: 1 }
    ]
  },
  {
    name: 'TP - Total Protein',
    code: 'TP',
    category: 'Laboratory',
    price: 150,
    sample: 'Serum',
    parameters: [
      { name: 'Total Protein', unit: 'g/dL', reference_range: '6.4-8.3', display_order: 1 }
    ]
  },
  {
    name: 'TC - Total Cholesterol',
    code: 'TC',
    category: 'Laboratory',
    price: 180,
    sample: 'Serum',
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', reference_range: '<200', display_order: 1 }
    ]
  },
  {
    name: 'TSH - Thyroid Stimulating Hormone',
    code: 'TSH',
    category: 'Laboratory',
    price: 300,
    sample: 'Serum',
    parameters: [
      { name: 'TSH', unit: 'µIU/mL', reference_range: '0.27-4.20', display_order: 1 }
    ]
  },
  {
    name: 'THYROID - Thyroid Profile (T3, T4, TSH)',
    code: 'THYROID',
    category: 'Laboratory',
    price: 650,
    sample: 'Serum',
    parameters: [
      { name: 'Total T3', unit: 'ng/mL', reference_range: '0.8-2.0', display_order: 1 },
      { name: 'Total T4', unit: 'µg/dL', reference_range: '5.1-14.1', display_order: 2 },
      { name: 'TSH', unit: 'µIU/mL', reference_range: '0.27-4.20', display_order: 3 }
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
      `SELECT service_id FROM diagnostic_services WHERE LOWER(name) LIKE $1 LIMIT 1`,
      [`%${test.code.toLowerCase()}%`]
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
    console.log('ALL 8 PDF BATCH 6 LABORATORY TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 6 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
