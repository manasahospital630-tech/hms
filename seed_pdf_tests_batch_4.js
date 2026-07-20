const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'HIV - Human Immunodeficiency Virus Test',
    code: 'HIV',
    category: 'Laboratory',
    price: 350,
    sample: 'Serum',
    parameters: [
      { name: 'HIV I & II Antibody', unit: '', reference_range: 'Non-Reactive', display_order: 1 }
    ]
  },
  {
    name: 'LP - Lipid Profile',
    code: 'LP',
    category: 'Laboratory',
    price: 600,
    sample: 'Serum',
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', reference_range: '<200', display_order: 1 },
      { name: 'Triglycerides', unit: 'mg/dL', reference_range: '<150', display_order: 2 },
      { name: 'HDL Cholesterol', unit: 'mg/dL', reference_range: 'Male >40; Female >50', display_order: 3 },
      { name: 'LDL Cholesterol', unit: 'mg/dL', reference_range: '<100', display_order: 4 },
      { name: 'VLDL Cholesterol', unit: 'mg/dL', reference_range: '5-40', display_order: 5 },
      { name: 'TC/HDL Ratio', unit: 'Ratio', reference_range: '<5', display_order: 6 }
    ]
  },
  {
    name: 'LH - Luteinizing Hormone',
    code: 'LH',
    category: 'Laboratory',
    price: 450,
    sample: 'Serum',
    parameters: [
      { name: 'Luteinizing Hormone', unit: 'mIU/mL', reference_range: 'Male 1.7-8.6; Female phase dependent', display_order: 1 }
    ]
  },
  {
    name: 'MP - Malaria Parasite (PV/PF)',
    code: 'MP',
    category: 'Laboratory',
    price: 300,
    sample: 'Whole Blood',
    parameters: [
      { name: 'Plasmodium vivax', unit: '', reference_range: 'Negative', display_order: 1 },
      { name: 'Plasmodium falciparum', unit: '', reference_range: 'Negative', display_order: 2 }
    ]
  },
  {
    name: 'MT - Mantoux Test',
    code: 'MT',
    category: 'Laboratory',
    price: 200,
    sample: 'Intradermal PPD',
    parameters: [
      { name: 'Induration after 48-72 hrs', unit: 'mm', reference_range: 'Interpret clinically', display_order: 1 }
    ]
  },
  {
    name: 'PRL - Prolactin',
    code: 'PRL',
    category: 'Laboratory',
    price: 450,
    sample: 'Serum',
    parameters: [
      { name: 'Prolactin', unit: 'ng/mL', reference_range: 'Male 4-15; Female 5-25', display_order: 1 }
    ]
  },
  {
    name: 'PSA - Prostate Specific Antigen',
    code: 'PSA',
    category: 'Laboratory',
    price: 650,
    sample: 'Serum',
    parameters: [
      { name: 'Total PSA', unit: 'ng/mL', reference_range: '0-4.0', display_order: 1 }
    ]
  },
  {
    name: 'PT/INR - Prothrombin Time & INR',
    code: 'PT/INR',
    category: 'Laboratory',
    price: 350,
    sample: 'Citrated Plasma',
    parameters: [
      { name: 'Prothrombin Time', unit: 'sec', reference_range: '11-13.5', display_order: 1 },
      { name: 'INR', unit: '', reference_range: '0.8-1.2', display_order: 2 }
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
    console.log('ALL 8 PDF BATCH 4 LABORATORY TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 4 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
