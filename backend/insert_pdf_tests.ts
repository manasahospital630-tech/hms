import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const tests = [
  { code: 'CBP', name: 'Complete Blood Picture', price: 300 },
  { code: 'ESR', name: 'Erythrocyte Sedimentation Rate', price: 250 },
  { code: 'WIDAL', name: 'Widal Test', price: 400 },
  { code: 'BGRH', name: 'Blood Group & Rh Typing', price: 150 },
  { code: 'RBS', name: 'Random Blood Sugar', price: 100 },
  { code: 'FBS', name: 'Fasting Blood Sugar', price: 70 },
  { code: 'PLBS', name: 'Post Lunch Blood Sugar (PPBS)', price: 70 },
  { code: 'GTT', name: 'Glucose Tolerance Test', price: 350 },
  { code: 'LP', name: 'Lipid Profile', price: 900 },
  { code: 'LFT', name: 'Liver Function Test', price: 700 },
  { code: 'SBIL', name: 'Serum Bilirubin', price: 300 },
  { code: 'CUE', name: 'Complete Urine Examination', price: 200 },
  { code: 'URC', name: 'Urine Culture & Sensitivity', price: 800 },
  { code: 'SOB', name: 'Stool Occult Blood', price: 800 },
  { code: 'SCS', name: 'Stool Culture & Sensitivity', price: 800 },
  { code: 'RFT-I', name: 'Renal Function Test - I', price: 500 },
  { code: 'BU', name: 'Blood Urea', price: 300 },
  { code: 'SCR', name: 'Serum Creatinine', price: 350 },
  { code: 'SUA', name: 'Serum Uric Acid', price: 500 },
  { code: 'RAF', name: 'Rheumatoid Arthritis Factor', price: 500 },
  { code: 'CRP', name: 'C-Reactive Protein', price: 600 },
  { code: 'ASO', name: 'Anti-Streptolysin O Titre', price: 600 },
  { code: 'HIV', name: 'Human Immunodeficiency Virus Test', price: 500 },
  { code: 'HCV', name: 'Hepatitis C Virus Test', price: 500 },
  { code: 'HBsAg', name: 'Hepatitis B Surface Antigen', price: 500 },
  { code: 'VDRL', name: 'Venereal Disease Research Laboratory Test', price: 500 },
  { code: 'MP', name: 'Malaria Parasite (PV/PF)', price: 500 },
  { code: 'ALB', name: 'Urine Albumin', price: 250 },
  { code: 'SE', name: 'Serum Electrolytes', price: 600 },
  { code: 'eGFR', name: 'Estimated Glomerular Filtration Rate', price: 300 },
  { code: 'MT', name: 'Mantoux Test', price: 600 },
  { code: 'SCA', name: 'Serum Calcium', price: 400 },
  { code: 'ALP', name: 'Alkaline Phosphatase', price: 400 },
  { code: 'DENG', name: 'Dengue Profile (IgG, IgM, NS1)', price: 1500 },
  { code: 'CHIK', name: 'Chikungunya Test', price: 1500 },
  { code: 'HbA1c', name: 'Glycated Hemoglobin', price: 600 },
  { code: 'BTCT', name: 'Bleeding Time & Clotting Time', price: 200 },
  { code: 'TPF', name: 'Thyroid Profile', price: 600 },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone', price: 350 },
  { code: 'LH', name: 'Luteinizing Hormone', price: 600 },
  { code: 'FSH', name: 'Follicle Stimulating Hormone', price: 600 },
  { code: 'AMH', name: 'Anti-Müllerian Hormone', price: 1200 },
  { code: 'PRL', name: 'Prolactin', price: 800 },
  { code: 'TT', name: 'Total Testosterone', price: 900 },
  { code: 'FT', name: 'Free Testosterone', price: 900 },
  { code: 'PSA', name: 'Prostate Specific Antigen', price: 1000 },
  { code: 'Anti-TPO', name: 'Anti Thyroid Peroxidase Antibody', price: 1000 },
  { code: 'Vit-D3', name: 'Vitamin D3 (25-OH)', price: 1500 },
  { code: 'Vit-B12', name: 'Vitamin B12', price: 1350 },
  { code: 'FP6', name: 'Fever Profile (6 Parameters)', price: 2500 },
  { code: 'ANP11', name: 'Antenatal Profile (11 Parameters)', price: 2500 },
  { code: 'DSP3', name: 'Diabetic Sugar Profile (3 Parameters)', price: 450 },
  { code: 'RFT-II', name: 'Renal Function Test - II', price: 800 },
  { code: 'SP-M', name: 'Surgical Profile (Minor)', price: 3000 },
  { code: 'SP-MJ', name: 'Surgical Profile (Major)', price: 4500 },
  { code: 'CP', name: 'Coagulation Profile', price: 1200 },
  { code: 'PT/INR', name: 'Prothrombin Time & International Normalized Ratio', price: 700 },
  { code: 'APTT', name: 'Activated Partial Thromboplastin Time', price: 700 },
  { code: 'DD', name: 'D-Dimer', price: 1700 },
  { code: 'Tn-I', name: 'Troponin-I', price: 1800 },
  { code: 'Tn-T', name: 'Troponin-T', price: 2000 },
  { code: 'TP', name: 'Total Protein', price: 300 },
  { code: 'DNS1', name: 'Dengue NS1 Antigen', price: 700 },
  { code: 'DIGM/G', name: 'Dengue IgM/IgG Antibody', price: 1000 },
  { code: 'β-HCG', name: 'Beta Human Chorionic Gonadotropin', price: 950 },
  { code: 'UPT', name: 'Urine Pregnancy Test', price: 400 },
  { code: 'AEC', name: 'Absolute Eosinophil Count', price: 300 },
  { code: 'AMY', name: 'Serum Amylase', price: 800 },
  { code: 'LIP', name: 'Serum Lipase', price: 800 },
  { code: 'HDL', name: 'High-Density Lipoprotein Cholesterol', price: 600 },
  { code: 'TC', name: 'Total Cholesterol', price: 600 },
  { code: 'TG', name: 'Triglycerides', price: 600 },
  { code: 'FT3', name: 'Free Triiodothyronine (Free T3)', price: 800 },
  { code: 'FT4', name: 'Free Tyroxine (Free T4)', price: 800 }
];

async function seed() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('Connected to database.');

  // Find Laboratory category
  const catRes = await client.query("SELECT category_id FROM diagnostic_categories WHERE name = 'Laboratory' LIMIT 1");
  if (catRes.rows.length === 0) {
    console.error('Laboratory category not found in diagnostic_categories.');
    await client.end();
    return;
  }

  const categoryId = catRes.rows[0].category_id;
  console.log(`Found Laboratory Category UUID: ${categoryId}`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const t of tests) {
    // Check if service code already exists
    const checkRes = await client.query('SELECT service_id FROM diagnostic_services WHERE service_code = $1', [t.code]);
    if (checkRes.rows.length > 0) {
      // Just update the price and name if it exists, to match user values
      await client.query(
        'UPDATE diagnostic_services SET name = $1, price = $2 WHERE service_code = $3',
        [t.name, t.price, t.code]
      );
      skippedCount++;
    } else {
      // Insert new service
      await client.query(
        `INSERT INTO diagnostic_services 
        (name, category_id, service_code, price, gst_percentage, duration_minutes, sample_required, normal_range, machine_required, home_collection_available, emergency_available, is_active)
        VALUES ($1, $2, $3, $4, 18, 30, 'Blood', '', '', false, false, true)`,
        [t.name, categoryId, t.code, t.price]
      );
      insertedCount++;
    }
  }

  console.log(`Completed seeding. Inserted: ${insertedCount}, Updated/Skipped: ${skippedCount}`);
  await client.end();
}

seed().catch(console.error);
