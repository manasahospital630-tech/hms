const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'BU - Blood Urea',
    code: 'BU',
    category: 'Laboratory',
    price: 180,
    sample: 'Serum',
    parameters: [
      { name: 'Blood Urea', unit: 'mg/dL', reference_range: '15-40', display_order: 1 }
    ]
  },
  {
    name: 'CRP - C-Reactive Protein',
    code: 'CRP',
    category: 'Laboratory',
    price: 350,
    sample: 'Serum',
    parameters: [
      { name: 'C-Reactive Protein', unit: 'mg/L', reference_range: '<5', display_order: 1 }
    ]
  },
  {
    name: 'CHIK - Chikungunya Test',
    code: 'CHIK',
    category: 'Laboratory',
    price: 650,
    sample: 'Serum',
    parameters: [
      { name: 'Chikungunya IgM', unit: '', reference_range: 'Negative', display_order: 1 },
      { name: 'Chikungunya IgG', unit: '', reference_range: 'Negative', display_order: 2 }
    ]
  },
  {
    name: 'DD - D-Dimer',
    code: 'DD',
    category: 'Laboratory',
    price: 1200,
    sample: 'Citrated Plasma',
    parameters: [
      { name: 'D-Dimer', unit: 'mg/L FEU', reference_range: '<0.50', display_order: 1 }
    ]
  },
  {
    name: 'DIGM/G - Dengue IgM/IgG Antibody',
    code: 'DIGM/G',
    category: 'Laboratory',
    price: 700,
    sample: 'Serum',
    parameters: [
      { name: 'Dengue IgM', unit: '', reference_range: 'Negative', display_order: 1 },
      { name: 'Dengue IgG', unit: '', reference_range: 'Negative', display_order: 2 }
    ]
  },
  {
    name: 'DNS1 - Dengue NS1 Antigen',
    code: 'DNS1',
    category: 'Laboratory',
    price: 600,
    sample: 'Serum',
    parameters: [
      { name: 'NS1 Antigen', unit: '', reference_range: 'Negative', display_order: 1 }
    ]
  },
  {
    name: 'DENG - Dengue Profile (IgG, IgM, NS1)',
    code: 'DENG',
    category: 'Laboratory',
    price: 1100,
    sample: 'Serum',
    parameters: [
      { name: 'NS1 Antigen', unit: '', reference_range: 'Negative', display_order: 1 },
      { name: 'Dengue IgM', unit: '', reference_range: 'Negative', display_order: 2 },
      { name: 'Dengue IgG', unit: '', reference_range: 'Negative', display_order: 3 }
    ]
  },
  {
    name: 'ESR - Erythrocyte Sedimentation Rate',
    code: 'ESR',
    category: 'Laboratory',
    price: 150,
    sample: 'EDTA Whole Blood',
    parameters: [
      { name: 'ESR', unit: 'mm/hr', reference_range: 'Male 0-15; Female 0-20', display_order: 1 }
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

  // Find by service code or title match
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
    console.log('ALL 8 PDF BATCH 2 LABORATORY TESTS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF batch 2 tests:', err);
  } finally {
    await pool.end();
  }
}

run();
