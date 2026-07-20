const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

const testsToSeed = [
  {
    name: 'Anti-TPO - Anti Thyroid Peroxidase Antibody',
    code: 'Anti-TPO',
    category: 'Laboratory',
    price: 850,
    sample: 'Blood',
    parameters: [
      { name: 'Anti-TPO Antibody', unit: 'IU/mL', reference_range: '<35', display_order: 1 }
    ]
  },
  {
    name: 'AMH - Anti-Müllerian Hormone',
    code: 'AMH',
    category: 'Laboratory',
    price: 1800,
    sample: 'Blood',
    parameters: [
      { name: 'AMH', unit: 'ng/mL', reference_range: '1.0-4.0*', display_order: 1 }
    ]
  },
  {
    name: 'ASO - Anti-Streptolysin O Titre',
    code: 'ASO',
    category: 'Laboratory',
    price: 400,
    sample: 'Blood',
    parameters: [
      { name: 'ASO Titre', unit: 'IU/mL', reference_range: '<200', display_order: 1 }
    ]
  },
  {
    name: 'β-HCG - Beta Human Chorionic Gonadotropin',
    code: 'β-HCG',
    category: 'Laboratory',
    price: 750,
    sample: 'Blood',
    parameters: [
      { name: 'Beta HCG', unit: 'mIU/mL', reference_range: 'Interpret clinically', display_order: 1 }
    ]
  },
  {
    name: 'BTCT - Bleeding Time & Clotting Time',
    code: 'BTCT',
    category: 'Laboratory',
    price: 250,
    sample: 'Blood',
    parameters: [
      { name: 'Bleeding Time', unit: 'min', reference_range: '2-7', display_order: 1 },
      { name: 'Clotting Time', unit: 'min', reference_range: '5-11', display_order: 2 }
    ]
  },
  {
    name: 'BGRH - Blood Group & Rh Typing',
    code: 'BGRH',
    category: 'Laboratory',
    price: 200,
    sample: 'Blood',
    parameters: [
      { name: 'ABO Blood Group', unit: '', reference_range: 'A/B/AB/O', display_order: 1 },
      { name: 'Rh Factor', unit: '', reference_range: 'Positive/Negative', display_order: 2 }
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
    console.log('ALL 6 PDF TEST MANUAL SERVICES AND PARAMETERS SUCCESSFULLY SEEDED TO DATABASE!');
  } catch (err) {
    console.error('Error seeding PDF tests:', err);
  } finally {
    await pool.end();
  }
}

run();
