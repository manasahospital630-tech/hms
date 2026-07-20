const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'USG_ABD_PEL - Abdomen & Pelvis Ultrasound',
    code: 'USG_ABD_PEL',
    category: 'Radiology',
    price: 1200,
    sample: 'None',
    parameters: [
      { name: 'Liver', unit: '', reference_range: 'Normal', display_order: 1 },
      { name: 'Gall Bladder', unit: '', reference_range: 'Normal', display_order: 2 },
      { name: 'Pancreas', unit: '', reference_range: 'Normal', display_order: 3 },
      { name: 'Spleen', unit: '', reference_range: 'Normal', display_order: 4 },
      { name: 'Kidneys', unit: '', reference_range: 'Normal', display_order: 5 },
      { name: 'Urinary Bladder', unit: '', reference_range: 'Normal', display_order: 6 },
      { name: 'Prostate/Uterus & Ovaries', unit: '', reference_range: 'Normal', display_order: 7 },
      { name: 'Impression', unit: '', reference_range: 'No significant abnormality', display_order: 8 }
    ]
  },
  {
    name: 'XRAY_CHEST - Chest X-Ray (PA View)',
    code: 'XRAY_CHEST',
    category: 'Radiology',
    price: 450,
    sample: 'None',
    parameters: [
      { name: 'Lung Fields', unit: '', reference_range: 'Clear', display_order: 1 },
      { name: 'Cardiac Silhouette', unit: '', reference_range: 'Normal', display_order: 2 },
      { name: 'Mediastinum', unit: '', reference_range: 'Normal', display_order: 3 },
      { name: 'Pleura', unit: '', reference_range: 'No effusion', display_order: 4 },
      { name: 'Bones', unit: '', reference_range: 'No abnormality', display_order: 5 },
      { name: 'Impression', unit: '', reference_range: 'Normal Chest X-ray', display_order: 6 }
    ]
  },
  {
    name: 'Vit-D3 - Vitamin D3 (25-OH)',
    code: 'Vit-D3',
    category: 'Laboratory',
    price: 1400,
    sample: 'Serum',
    parameters: [
      { name: 'Vitamin D3', unit: 'ng/mL', reference_range: '30-100', display_order: 1 }
    ]
  },
  {
    name: 'Vit-B12 - Vitamin B12',
    code: 'Vit-B12',
    category: 'Laboratory',
    price: 900,
    sample: 'Serum',
    parameters: [
      { name: 'Vitamin B12', unit: 'pg/mL', reference_range: '200-900', display_order: 1 }
    ]
  },
  {
    name: 'VDRL - Venereal Disease Research Laboratory Test',
    code: 'VDRL',
    category: 'Laboratory',
    price: 200,
    sample: 'Serum',
    parameters: [
      { name: 'VDRL', unit: '', reference_range: 'Non-Reactive', display_order: 1 }
    ]
  },
  {
    name: 'UPT - Urine Pregnancy Test',
    code: 'UPT',
    category: 'Laboratory',
    price: 150,
    sample: 'Urine',
    parameters: [
      { name: 'Urine hCG', unit: '', reference_range: 'Negative', display_order: 1 }
    ]
  },
  {
    name: 'URC - Urine Culture & Sensitivity',
    code: 'URC',
    category: 'Laboratory',
    price: 750,
    sample: 'Urine',
    parameters: [
      { name: 'Culture', unit: '', reference_range: 'No Growth', display_order: 1 },
      { name: 'Sensitivity', unit: '', reference_range: 'As applicable', display_order: 2 }
    ]
  },
  {
    name: 'ALB - Urine Albumin',
    code: 'ALB',
    category: 'Laboratory',
    price: 150,
    sample: 'Urine',
    parameters: [
      { name: 'Urine Albumin', unit: 'mg/dL', reference_range: 'Negative', display_order: 1 }
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
    console.log('ALL 8 PDF BATCH 5 (RADIOLOGY & LAB) TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 5 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
