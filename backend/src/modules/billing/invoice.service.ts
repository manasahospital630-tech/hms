import { query, getClient } from '../../config/database';
import { CreateInvoiceInput, RecordPaymentInput } from './billing.schema';
import { AppError } from '../../middleware/errorHandler';

export const createInvoice = async (input: CreateInvoiceInput) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = subtotal - (input.discount || 0) + (input.tax || 0);
    const patientResponsibility = totalAmount - (input.insuranceCoverage || 0);

    const amountPaid = input.paymentStatus === 'Paid' ? patientResponsibility : 0.00;
    const status = input.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid';
    const paymentMethod = input.paymentStatus === 'Paid' ? (input.paymentMethod || 'Cash') : null;

    const invoiceResult = await client.query(
      `INSERT INTO invoices (patient_id, encounter_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, status, payment_method, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        input.patientId, 
        input.encounterId || null, 
        totalAmount, 
        input.discount || 0, 
        input.tax || 0, 
        input.insuranceCoverage || 0, 
        patientResponsibility,
        amountPaid,
        status,
        paymentMethod,
        input.notes || null
      ]
    );
    const invoice = invoiceResult.rows[0];

    for (const item of input.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)`,
        [invoice.invoice_id, item.description, item.category || 'General', item.quantity, item.unitPrice]
      );
    }

    // Hook: Automatically create a diagnostics test order if any diagnostics/lab items are billed
    const diagnosticItems = input.items.filter((item: any) => {
      const cat = (item.category || '').toLowerCase();
      const isDiagCat = 
        cat.includes('diagnostics') || 
        cat.includes('lab') || 
        cat.includes('radiology') || 
        cat.includes('ultrasound') || 
        cat.includes('ecg') || 
        cat.includes('cardiology');
        
      const desc = (item.description || '').toLowerCase();
      const isDiagDesc = 
        desc.includes('cbp') || 
        desc.includes('cue') || 
        desc.includes('ecg') || 
        desc.includes('xray') || 
        desc.includes('x-ray') || 
        desc.includes('x ray') || 
        desc.includes('usg') || 
        desc.includes('ultrasound') || 
        desc.includes('electrocardiogram');

      return isDiagCat || isDiagDesc;
    });

    if (diagnosticItems.length > 0) {
      let doctorId = null;
      if (input.encounterId) {
        const encRes = await client.query('SELECT provider_id FROM encounters WHERE encounter_id = $1', [input.encounterId]);
        if (encRes.rows.length > 0) doctorId = encRes.rows[0].provider_id;
      }
      if (!doctorId) {
        const patRes = await client.query('SELECT assigned_doctor_id FROM patients WHERE patient_id = $1', [input.patientId]);
        if (patRes.rows.length > 0) doctorId = patRes.rows[0].assigned_doctor_id;
      }
      if (!doctorId) {
        const docRes = await client.query("SELECT user_id FROM users WHERE role = 'Doctor' OR role = 'Admin' ORDER BY role LIMIT 1");
        if (docRes.rows.length > 0) doctorId = docRes.rows[0].user_id;
      }

      if (doctorId) {
        const orderNum = `BILL-LAB-${invoice.invoice_id.substring(0, 8).toUpperCase()}`;
        const paymentStatus = status === 'Paid' ? 'Paid' : 'Unpaid';
        
        const orderRes = await client.query(
          `INSERT INTO test_orders (order_number, patient_id, doctor_id, priority, clinical_notes, diagnosis, payment_status, status)
           VALUES ($1, $2, $3, 'Routine', 'Ordered from Invoices & Billing Panel', 'Billed', $4, 'Ordered')
           RETURNING order_id`,
          [orderNum, input.patientId, doctorId, paymentStatus]
        );
        const orderId = orderRes.rows[0].order_id;

        for (const diagItem of diagnosticItems) {
          const descLower = diagItem.description.toLowerCase();
          let targetCategoryName = null;

          if (descLower.includes('xray') || descLower.includes('x-ray') || descLower.includes('x ray') || descLower.includes('radiology')) {
            targetCategoryName = 'Radiology';
          } else if (descLower.includes('usg') || descLower.includes('ultrasound') || descLower.includes('pelvis') || descLower.includes('obstetric') || descLower.includes('anomaly')) {
            targetCategoryName = 'Ultrasound';
          } else if (descLower.includes('ecg') || descLower.includes('electrocardiogram') || descLower.includes('echo') || descLower.includes('treadmill')) {
            targetCategoryName = 'Cardiology Diagnostics';
          }

          let serviceId = null;

          if (targetCategoryName) {
            // 1. Try to find a matching service in that specific category
            let servRes = await client.query(
              `SELECT service_id FROM diagnostic_services 
               WHERE (LOWER(name) = LOWER($1) OR LOWER(service_code) = LOWER($1))
               AND category_id = (SELECT category_id FROM diagnostic_categories WHERE name = $2 LIMIT 1)
               LIMIT 1`,
              [diagItem.description.trim(), targetCategoryName]
            );

            if (servRes.rows.length === 0) {
              servRes = await client.query(
                `SELECT service_id FROM diagnostic_services 
                 WHERE (LOWER(name) LIKE '%' || LOWER($1) || '%' OR LOWER(service_code) LIKE '%' || LOWER($1) || '%')
                 AND category_id = (SELECT category_id FROM diagnostic_categories WHERE name = $2 LIMIT 1)
                 LIMIT 1`,
                [diagItem.description.trim(), targetCategoryName]
              );
            }

            if (servRes.rows.length > 0) {
              serviceId = servRes.rows[0].service_id;
            } else {
              // Fallback to first service in that specific category
              const catFallRes = await client.query(
                `SELECT service_id FROM diagnostic_services 
                 WHERE category_id = (SELECT category_id FROM diagnostic_categories WHERE name = $1 LIMIT 1)
                 LIMIT 1`,
                [targetCategoryName]
              );
              if (catFallRes.rows.length > 0) {
                serviceId = catFallRes.rows[0].service_id;
              }
            }
          }

          if (!serviceId) {
            // General Fallback mapping for other categories (e.g. Lab)
            let servRes = await client.query(
              `SELECT service_id FROM diagnostic_services 
               WHERE LOWER(name) = LOWER($1) OR LOWER(service_code) = LOWER($1) 
               LIMIT 1`,
              [diagItem.description.trim()]
            );
            
            if (servRes.rows.length === 0) {
              servRes = await client.query(
                `SELECT service_id FROM diagnostic_services 
                 WHERE LOWER(name) LIKE '%' || LOWER($1) || '%' OR LOWER(service_code) LIKE '%' || LOWER($1) || '%'
                 LIMIT 1`,
                [diagItem.description.trim()]
              );
            }

            if (servRes.rows.length > 0) {
              serviceId = servRes.rows[0].service_id;
            } else {
              const fallbackServ = await client.query(
                `SELECT service_id FROM diagnostic_services 
                 WHERE category_id IN (
                   SELECT category_id FROM diagnostic_categories WHERE LOWER(name) = LOWER($1)
                 ) LIMIT 1`,
                [diagItem.category]
              );
              if (fallbackServ.rows.length > 0) {
                serviceId = fallbackServ.rows[0].service_id;
              } else {
                const firstServ = await client.query(`SELECT service_id FROM diagnostic_services LIMIT 1`);
                if (firstServ.rows.length > 0) serviceId = firstServ.rows[0].service_id;
              }
            }
          }

          if (serviceId) {
            await client.query(
              `INSERT INTO test_order_items (order_id, service_id, status)
               VALUES ($1, $2, 'Ordered')`,
              [orderId, serviceId]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    return invoice;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getInvoiceById = async (id: string) => {
  const result = await query(
    `SELECT i.*, 
            p.first_name || ' ' || p.last_name as patient_name, 
            p.first_name, p.last_name, p.phone, p.address, p.medical_record_number, p.is_inpatient,
            p.gender, p.date_of_birth AS birth_date, p.age AS patient_age,
            COALESCE(d.first_name || ' ' || d.last_name, ip_d.first_name || ' ' || ip_d.last_name) as doctor_name
     FROM invoices i 
     JOIN patients p ON i.patient_id = p.patient_id 
     LEFT JOIN encounters e ON i.encounter_id = e.encounter_id
     LEFT JOIN users d ON e.provider_id = d.user_id
     LEFT JOIN ip_admissions ipa ON i.ip_admission_id = ipa.ip_admission_id
     LEFT JOIN users ip_d ON ipa.admitting_doctor_id = ip_d.user_id
     WHERE i.invoice_id = $1`, [id]
  );
  if (result.rows.length === 0) throw new AppError('Invoice not found.', 404);
  const items = await query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
  const invoice = result.rows[0];
  invoice.items = items.rows;
  return invoice;
};

export const getAllInvoices = async (filters: { status?: string; limit?: number; offset?: number }) => {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  if (filters.status) { params.push(filters.status); whereClause += ` AND i.status = $${params.length}`; }

  const countResult = await query(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`, params);
  const dataParams = [...params];
  let limitClause = '';
  if (filters.limit) { dataParams.push(filters.limit); limitClause += ` LIMIT $${dataParams.length}`; }
  if (filters.offset) { dataParams.push(filters.offset); limitClause += ` OFFSET $${dataParams.length}`; }

  const result = await query(
    `SELECT i.*, p.first_name || ' ' || p.last_name as patient_name FROM invoices i
     JOIN patients p ON i.patient_id = p.patient_id ${whereClause} ORDER BY i.created_at DESC ${limitClause}`, dataParams
  );
  return { invoices: result.rows, total: parseInt(countResult.rows[0].total, 10) };
};

export const getPatientInvoices = async (patientId: string) => {
  const result = await query('SELECT * FROM invoices WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
  return result.rows;
};

export const recordPayment = async (id: string, input: RecordPaymentInput) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);

  const invoice = existing.rows[0];
  const newAmountPaid = parseFloat(invoice.amount_paid) + input.amountPaid;
  const patientResponsibility = parseFloat(invoice.patient_responsibility);
  let newStatus = 'PartiallyPaid';
  if (newAmountPaid >= patientResponsibility) newStatus = 'Paid';

  const result = await query(
    `UPDATE invoices SET amount_paid = $1, status = $2, payment_method = $3 WHERE invoice_id = $4 RETURNING *`,
    [newAmountPaid, newStatus, input.paymentMethod, id]
  );
  return result.rows[0];
};

export const cancelInvoice = async (id: string) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);
  
  const invoice = existing.rows[0];
  if (invoice.status === 'Paid') {
    throw new AppError('Cannot cancel a fully paid invoice. Try returning/refunding it instead.', 400);
  }

  const result = await query(
    `UPDATE invoices SET status = 'Cancelled' WHERE invoice_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

export const returnInvoice = async (id: string) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);

  const result = await query(
    `UPDATE invoices SET status = 'Returned', amount_paid = 0.00 WHERE invoice_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

export const updateInvoiceStatus = async (id: string, status: 'Paid' | 'Unpaid', paymentMethod: string) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);

  const invoice = existing.rows[0];
  const targetAmountPaid = status === 'Paid' ? parseFloat(invoice.total_amount) : 0.00;

  const result = await query(
    `UPDATE invoices SET amount_paid = $1, status = $2, payment_method = $3 WHERE invoice_id = $4 RETURNING *`,
    [targetAmountPaid, status, paymentMethod, id]
  );

  // Sync diagnostic test order payment status if matching
  const orderNum = `BILL-LAB-${id.substring(0, 8).toUpperCase()}`;
  await query(`UPDATE test_orders SET payment_status = $1 WHERE order_number = $2`, [status, orderNum]);

  return result.rows[0];
};
