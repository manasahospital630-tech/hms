const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'eGFR - Estimated Glomerular Filtration Rate',
    code: 'eGFR',
    category: 'Laboratory',
    price: 300,
    sample: 'Serum',
    parameters: [
      { name: 'eGFR', unit: 'mL/min/1.73m²', reference_range: '>=90', display_order: 1 }
    ]
  },
  {
    name: 'FSH - Follicle Stimulating Hormone',
    code: 'FSH',
    category: 'Laboratory',
    price: 450,
    sample: 'Serum',
    parameters: [
      { name: 'FSH', unit: 'mIU/mL', reference_range: 'Male:1.5-12.4; Female phase dependent', display_order: 1 }
    ]
  },
  {
    name: 'FT - Free Testosterone',
    code: 'FT',
    category: 'Laboratory',
    price: 850,
    sample: 'Serum',
    parameters: [
      { name: 'Free Testosterone', unit: 'pg/mL', reference_range: 'Male:5-21', display_order: 1 }
    ]
  },
  {
    name: 'FT3 - Free Triiodothyronine',
    code: 'FT3',
    category: 'Laboratory',
    price: 400,
    sample: 'Serum',
    parameters: [
      { name: 'Free T3', unit: 'pg/mL', reference_range: '2.0-4.4', display_order: 1 }
    ]
  },
  {
    name: 'FT4 - Free Thyroxine',
    code: 'FT4',
    category: 'Laboratory',
    price: 400,
    sample: 'Serum',
    parameters: [
      { name: 'Free T4', unit: 'ng/dL', reference_range: '0.8-1.8', display_order: 1 }
    ]
  },
  {
    name: 'GTT - Glucose Tolerance Test',
    code: 'GTT',
    category: 'Laboratory',
    price: 350,
    sample: 'Fluoride Plasma',
    parameters: [
      { name: 'Fasting Glucose', unit: 'mg/dL', reference_range: '70-99', display_order: 1 },
      { name: '1 Hour Glucose', unit: 'mg/dL', reference_range: 'Lab specific', display_order: 2 },
      { name: '2 Hour Glucose', unit: 'mg/dL', reference_range: '<140', display_order: 3 }
    ]
  },
  {
    name: 'HbA1c - Glycated Hemoglobin',
    code: 'HbA1c',
    category: 'Laboratory',
    price: 500,
    sample: 'EDTA Whole Blood',
    parameters: [
      { name: 'HbA1c', unit: '%', reference_range: '4.0-5.6', display_order: 1 }
    ]
  },
  {
    name: 'HBsAg - Hepatitis B Surface Antigen',
    code: 'HBsAg',
    category: 'Laboratory',
    price: 350,
    sample: 'Serum',
    parameters: [
      { name: 'HBsAg', unit: '', reference_range: 'Non-Reactive', display_order: 1 }
    ]
  },
  {
    name: 'HCV - Hepatitis C Virus Test',
    code: 'HCV',
    category: 'Laboratory',
    price: 450,
    sample: 'Serum',
    parameters: [
      { name: 'Anti-HCV', unit: '', reference_range: 'Non-Reactive', display_order: 1 }
    ]
  },
  {
    name: 'HDL - High-Density Lipoprotein Cholesterol',
    code: 'HDL',
    category: 'Laboratory',
    price: 200,
    sample: 'Serum',
    parameters: [
      { name: 'HDL Cholesterol', unit: 'mg/dL', reference_range: 'Male >40; Female >50', display_order: 1 }
    ]
  }
];

async function seedTestItem(test) {
  console.log(`Seeding service: ${test.name} (${test.code})...`);

  let catRes = await pool.query(`SELECT category_id FROM diagnostic_categories WHERE name = $1 LIMIT 1`, [test.category]);
  let catId = catRes.rows[0]?.category_id;
  if (!catId) {
    const newCat = await pool.query(`INSERT INTO diagnostic_categories (name, description) VALUES ($1, $2) RETURNING category_id`, [test.category, test.category]);
    catId = newCat.rows[0].category_id;
  }

  let svcRes = await pool.query(
    `SELECT service_id FROM diagnostic_services 
     WHERE LOWER(service_code) = LOWER($1) OR LOWER(name) LIKE $2 LIMIT 1`,
    [test.code, `%${test.code.toLowerCase()}%`]
  );

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
      `UPDATE diagnostic_services SET name = $1, service_code = $2, price = $3, sample_required = $4 WHERE service_id = $5`,
      [test.name, test.code, test.price, test.sample, serviceId]
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
    console.log('ALL 10 PDF BATCH 3 LABORATORY TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 3 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
