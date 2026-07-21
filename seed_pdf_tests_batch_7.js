const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'CP - Coagulation Profile',
    code: 'CP',
    category: 'Laboratory',
    price: 800,
    sample: 'Citrated Plasma',
    parameters: [
      { name: 'PT', unit: 'sec', reference_range: '11-13.5', display_order: 1 },
      { name: 'INR', unit: '', reference_range: '0.8-1.2', display_order: 2 },
      { name: 'APTT', unit: 'sec', reference_range: '25-35', display_order: 3 }
    ]
  },
  {
    name: 'RFT-I - Renal Function Test - I',
    code: 'RFT-I',
    category: 'Laboratory',
    price: 550,
    sample: 'Serum',
    parameters: [
      { name: 'Blood Urea', unit: 'mg/dL', reference_range: '15-40', display_order: 1 },
      { name: 'Serum Creatinine', unit: 'mg/dL', reference_range: '0.7-1.3', display_order: 2 },
      { name: 'Uric Acid', unit: 'mg/dL', reference_range: '3.4-7.0', display_order: 3 }
    ]
  },
  {
    name: 'RAF - Rheumatoid Arthritis Factor',
    code: 'RAF',
    category: 'Laboratory',
    price: 400,
    sample: 'Serum',
    parameters: [
      { name: 'Rheumatoid Factor', unit: 'IU/mL', reference_range: '<20', display_order: 1 }
    ]
  },
  {
    name: 'AMY - Serum Amylase',
    code: 'AMY',
    category: 'Laboratory',
    price: 450,
    sample: 'Serum',
    parameters: [
      { name: 'Serum Amylase', unit: 'U/L', reference_range: '30-110', display_order: 1 }
    ]
  },
  {
    name: 'SBIL - Serum Bilirubin',
    code: 'SBIL',
    category: 'Laboratory',
    price: 200,
    sample: 'Serum',
    parameters: [
      { name: 'Total Bilirubin', unit: 'mg/dL', reference_range: '0.3-1.2', display_order: 1 }
    ]
  },
  {
    name: 'SCA - Serum Calcium',
    code: 'SCA',
    category: 'Laboratory',
    price: 200,
    sample: 'Serum',
    parameters: [
      { name: 'Serum Calcium', unit: 'mg/dL', reference_range: '8.5-10.5', display_order: 1 }
    ]
  },
  {
    name: 'SCR - Serum Creatinine',
    code: 'SCR',
    category: 'Laboratory',
    price: 180,
    sample: 'Serum',
    parameters: [
      { name: 'Serum Creatinine', unit: 'mg/dL', reference_range: '0.7-1.3', display_order: 1 }
    ]
  },
  {
    name: 'LIP - Serum Lipase',
    code: 'LIP',
    category: 'Laboratory',
    price: 600,
    sample: 'Serum',
    parameters: [
      { name: 'Serum Lipase', unit: 'U/L', reference_range: '13-60', display_order: 1 }
    ]
  },
  {
    name: 'SUA - Serum Uric Acid',
    code: 'SUA',
    category: 'Laboratory',
    price: 180,
    sample: 'Serum',
    parameters: [
      { name: 'Serum Uric Acid', unit: 'mg/dL', reference_range: 'Male 3.4-7.0', display_order: 1 }
    ]
  },
  {
    name: 'SCS - Stool Culture & Sensitivity',
    code: 'SCS',
    category: 'Laboratory',
    price: 650,
    sample: 'Stool',
    parameters: [
      { name: 'Culture', unit: '', reference_range: 'No Pathogen', display_order: 1 },
      { name: 'Sensitivity', unit: '', reference_range: 'As applicable', display_order: 2 }
    ]
  },
  {
    name: 'SOB - Stool Occult Blood',
    code: 'SOB',
    category: 'Laboratory',
    price: 200,
    sample: 'Stool',
    parameters: [
      { name: 'Occult Blood', unit: '', reference_range: 'Negative', display_order: 1 }
    ]
  },
  {
    name: 'SP-MJ - Surgical Profile (Major)',
    code: 'SP-MJ',
    category: 'Laboratory',
    price: 2500,
    sample: 'Whole Blood / Serum',
    parameters: [
      { name: 'CBP', unit: '', reference_range: 'Included', display_order: 1 },
      { name: 'Blood Group', unit: '', reference_range: 'Included', display_order: 2 },
      { name: 'RBS', unit: '', reference_range: 'Included', display_order: 3 },
      { name: 'LFT', unit: '', reference_range: 'Included', display_order: 4 },
      { name: 'RFT', unit: '', reference_range: 'Included', display_order: 5 },
      { name: 'PT/INR', unit: '', reference_range: 'Included', display_order: 6 },
      { name: 'APTT', unit: '', reference_range: 'Included', display_order: 7 },
      { name: 'HIV/HBsAg/HCV', unit: '', reference_range: 'Included', display_order: 8 }
    ]
  },
  {
    name: 'SP-M - Surgical Profile (Minor)',
    code: 'SP-M',
    category: 'Laboratory',
    price: 1200,
    sample: 'Whole Blood / Serum',
    parameters: [
      { name: 'CBP', unit: '', reference_range: 'Included', display_order: 1 },
      { name: 'RBS', unit: '', reference_range: 'Included', display_order: 2 },
      { name: 'BT/CT', unit: '', reference_range: 'Included', display_order: 3 },
      { name: 'Blood Group', unit: '', reference_range: 'Included', display_order: 4 }
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
    console.log('ALL 13 PDF BATCH 7 LABORATORY TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 7 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
