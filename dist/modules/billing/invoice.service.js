"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingAnalytics = exports.updateInvoiceStatus = exports.returnInvoice = exports.cancelInvoice = exports.recordPayment = exports.getPatientInvoices = exports.getAllInvoices = exports.collectDue = exports.getInvoicePaymentLogs = exports.getInvoiceById = exports.createInvoice = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const createInvoice = async (input, currentUser) => {
    const client = await (0, database_1.getClient)();
    try {
        await client.query('BEGIN');
        const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const totalAmount = subtotal - (input.discount || 0) + (input.tax || 0);
        const patientResponsibility = totalAmount - (input.insuranceCoverage || 0);
        // Calculate advance / paid vs due amount
        let paidAmount = 0.00;
        if (input.paidAmount !== undefined && input.paidAmount !== null) {
            paidAmount = parseFloat(String(input.paidAmount));
        }
        else if (input.amountPaid !== undefined && input.amountPaid !== null) {
            paidAmount = parseFloat(String(input.amountPaid));
        }
        else if (input.paymentStatus === 'Paid') {
            paidAmount = patientResponsibility;
        }
        if (isNaN(paidAmount) || paidAmount < 0)
            paidAmount = 0.00;
        if (paidAmount > patientResponsibility)
            paidAmount = patientResponsibility;
        const dueAmount = Math.max(0.00, patientResponsibility - paidAmount);
        let status = 'Due';
        if (dueAmount <= 0.001 && (paidAmount > 0 || patientResponsibility === 0)) {
            status = 'Paid';
        }
        else if (paidAmount > 0 && dueAmount > 0) {
            status = 'Partially Paid';
        }
        else if (paidAmount === 0 && patientResponsibility > 0) {
            status = 'Due';
        }
        const paymentMethod = input.paymentMethod || (paidAmount > 0 ? 'Cash' : null);
        const collectorName = typeof currentUser === 'string'
            ? currentUser
            : (currentUser?.name || (currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : 'System Staff'));
        const invoiceResult = await client.query(`INSERT INTO invoices (patient_id, encounter_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, due_amount, status, payment_method, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [
            input.patientId,
            input.encounterId || null,
            totalAmount,
            input.discount || 0,
            input.tax || 0,
            input.insuranceCoverage || 0,
            patientResponsibility,
            paidAmount,
            dueAmount,
            status,
            paymentMethod,
            input.notes || null,
            currentUser?.user_id || currentUser?.id || null
        ]);
        const invoice = invoiceResult.rows[0];
        // Log initial payment into invoice_payment_logs if paidAmount > 0
        if (paidAmount > 0) {
            const pType = dueAmount <= 0.001 ? 'Full Payment' : 'Advance Payment';
            await client.query(`INSERT INTO invoice_payment_logs (invoice_id, amount_paid, payment_type, payment_mode, payment_timestamp, collected_by, remaining_due_after_txn, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                invoice.invoice_id,
                paidAmount,
                pType,
                paymentMethod || 'Cash',
                new Date(),
                collectorName,
                dueAmount,
                input.notes || (dueAmount <= 0.001 ? 'Full Payment at Invoice Generation' : 'Advance Payment at Invoice Generation')
            ]);
        }
        for (const item of input.items) {
            await client.query(`INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)`, [invoice.invoice_id, item.description, item.category || 'General', item.quantity, item.unitPrice]);
        }
        // Hook: Automatically create a diagnostics test order if any diagnostics/lab items are billed
        const diagnosticItems = input.items.filter((item) => {
            const cat = (item.category || '').toLowerCase();
            const isDiagCat = cat.includes('diagnostics') ||
                cat.includes('lab') ||
                cat.includes('radiology') ||
                cat.includes('ultrasound') ||
                cat.includes('ecg') ||
                cat.includes('cardiology');
            const desc = (item.description || '').toLowerCase();
            const isDiagDesc = desc.includes('cbp') ||
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
                if (encRes.rows.length > 0)
                    doctorId = encRes.rows[0].provider_id;
            }
            if (!doctorId) {
                const patRes = await client.query('SELECT assigned_doctor_id FROM patients WHERE patient_id = $1', [input.patientId]);
                if (patRes.rows.length > 0)
                    doctorId = patRes.rows[0].assigned_doctor_id;
            }
            if (!doctorId) {
                const docRes = await client.query("SELECT user_id FROM users WHERE role = 'Doctor' OR role = 'Admin' ORDER BY role LIMIT 1");
                if (docRes.rows.length > 0)
                    doctorId = docRes.rows[0].user_id;
            }
            if (doctorId) {
                const orderNum = `BILL-LAB-${invoice.invoice_id.substring(0, 8).toUpperCase()}`;
                const paymentStatus = status === 'Paid' ? 'Paid' : 'Unpaid';
                const orderRes = await client.query(`INSERT INTO test_orders (order_number, patient_id, doctor_id, priority, clinical_notes, diagnosis, payment_status, status)
           VALUES ($1, $2, $3, 'Routine', 'Ordered from Invoices & Billing Panel', 'Billed', $4, 'Ordered')
           RETURNING order_id`, [orderNum, input.patientId, doctorId, paymentStatus]);
                const orderId = orderRes.rows[0].order_id;
                for (const diagItem of diagnosticItems) {
                    const descClean = diagItem.description.trim();
                    // Check if item is a grouped Profile / Package
                    const pkgRes = await client.query(`SELECT package_id FROM diagnostic_packages 
             WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE '%' || LOWER($1) || '%'
             LIMIT 1`, [descClean]);
                    if (pkgRes.rows.length > 0) {
                        const packageId = pkgRes.rows[0].package_id;
                        const pServices = await client.query(`SELECT service_id FROM diagnostic_package_items WHERE package_id = $1`, [packageId]);
                        for (const ps of pServices.rows) {
                            await client.query(`INSERT INTO test_order_items (order_id, service_id, package_id, status)
                 VALUES ($1, $2, $3, 'Ordered')`, [orderId, ps.service_id, packageId]);
                        }
                        continue;
                    }
                    const descLower = descClean.toLowerCase();
                    let targetCategoryName = null;
                    if (descLower.includes('xray') || descLower.includes('x-ray') || descLower.includes('x ray') || descLower.includes('radiology')) {
                        targetCategoryName = 'Radiology';
                    }
                    else if (descLower.includes('usg') || descLower.includes('ultrasound') || descLower.includes('pelvis') || descLower.includes('obstetric') || descLower.includes('anomaly')) {
                        targetCategoryName = 'Ultrasound';
                    }
                    else if (descLower.includes('ecg') || descLower.includes('electrocardiogram') || descLower.includes('echo') || descLower.includes('treadmill')) {
                        targetCategoryName = 'Cardiology Diagnostics';
                    }
                    let serviceId = null;
                    if (targetCategoryName) {
                        // 1. Try to find a matching service in that specific category
                        let servRes = await client.query(`SELECT service_id FROM diagnostic_services 
               WHERE (LOWER(name) = LOWER($1) OR LOWER(service_code) = LOWER($1))
               AND category_id = (SELECT category_id FROM diagnostic_categories WHERE name = $2 LIMIT 1)
               LIMIT 1`, [descClean, targetCategoryName]);
                        if (servRes.rows.length === 0) {
                            servRes = await client.query(`SELECT service_id FROM diagnostic_services 
                 WHERE (LOWER(name) LIKE '%' || LOWER($1) || '%' OR LOWER(service_code) LIKE '%' || LOWER($1) || '%')
                 AND category_id = (SELECT category_id FROM diagnostic_categories WHERE name = $2 LIMIT 1)
                 LIMIT 1`, [descClean, targetCategoryName]);
                        }
                        if (servRes.rows.length > 0) {
                            serviceId = servRes.rows[0].service_id;
                        }
                        else {
                            // Fallback to first service in that specific category
                            const catFallRes = await client.query(`SELECT service_id FROM diagnostic_services 
                 WHERE category_id = (SELECT category_id FROM diagnostic_categories WHERE name = $1 LIMIT 1)
                 LIMIT 1`, [targetCategoryName]);
                            if (catFallRes.rows.length > 0) {
                                serviceId = catFallRes.rows[0].service_id;
                            }
                        }
                    }
                    if (!serviceId) {
                        // General Fallback mapping for other categories (e.g. Lab)
                        let servRes = await client.query(`SELECT service_id FROM diagnostic_services 
               WHERE LOWER(name) = LOWER($1) OR LOWER(service_code) = LOWER($1) 
               LIMIT 1`, [descClean]);
                        if (servRes.rows.length === 0) {
                            servRes = await client.query(`SELECT service_id FROM diagnostic_services 
                 WHERE LOWER(name) LIKE '%' || LOWER($1) || '%' OR LOWER(service_code) LIKE '%' || LOWER($1) || '%'
                 LIMIT 1`, [descClean]);
                        }
                        if (servRes.rows.length > 0) {
                            serviceId = servRes.rows[0].service_id;
                        }
                        else {
                            const fallbackServ = await client.query(`SELECT service_id FROM diagnostic_services 
                 WHERE category_id IN (
                   SELECT category_id FROM diagnostic_categories WHERE LOWER(name) = LOWER($1)
                 ) LIMIT 1`, [diagItem.category]);
                            if (fallbackServ.rows.length > 0) {
                                serviceId = fallbackServ.rows[0].service_id;
                            }
                            else {
                                const firstServ = await client.query(`SELECT service_id FROM diagnostic_services LIMIT 1`);
                                if (firstServ.rows.length > 0)
                                    serviceId = firstServ.rows[0].service_id;
                            }
                        }
                    }
                    if (serviceId) {
                        await client.query(`INSERT INTO test_order_items (order_id, service_id, status)
               VALUES ($1, $2, 'Ordered')`, [orderId, serviceId]);
                    }
                }
            }
        }
        await client.query('COMMIT');
        return invoice;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createInvoice = createInvoice;
const getInvoiceById = async (id) => {
    const result = await (0, database_1.query)(`SELECT i.*, 
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
     WHERE i.invoice_id = $1`, [id]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Invoice not found.', 404);
    const items = await (0, database_1.query)('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
    const logs = await (0, database_1.query)('SELECT * FROM invoice_payment_logs WHERE invoice_id = $1 ORDER BY payment_timestamp ASC', [id]);
    const invoice = result.rows[0];
    invoice.items = items.rows;
    invoice.payment_logs = logs.rows;
    return invoice;
};
exports.getInvoiceById = getInvoiceById;
const getInvoicePaymentLogs = async (invoiceId) => {
    const result = await (0, database_1.query)(`SELECT * FROM invoice_payment_logs WHERE invoice_id = $1 ORDER BY payment_timestamp ASC`, [invoiceId]);
    return result.rows;
};
exports.getInvoicePaymentLogs = getInvoicePaymentLogs;
const collectDue = async (invoiceId, input, currentUser) => {
    const client = await (0, database_1.getClient)();
    try {
        await client.query('BEGIN');
        const invRes = await client.query(`
      SELECT i.*, p.first_name || ' ' || p.last_name as patient_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.patient_id
      WHERE i.invoice_id = $1 FOR UPDATE
    `, [invoiceId]);
        if (invRes.rows.length === 0) {
            throw new errorHandler_1.AppError('Invoice not found.', 404);
        }
        const invoice = invRes.rows[0];
        const totalResp = parseFloat(invoice.patient_responsibility || invoice.total_amount || 0);
        const prevPaid = parseFloat(invoice.amount_paid || 0);
        const prevDue = parseFloat(invoice.due_amount !== null && invoice.due_amount !== undefined ? invoice.due_amount : Math.max(0, totalResp - prevPaid));
        if (prevDue <= 0.001) {
            throw new errorHandler_1.AppError('Invoice balance is already ₹0. No due amount remaining.', 400);
        }
        const collectAmount = parseFloat(String(input.collectAmount));
        if (isNaN(collectAmount) || collectAmount <= 0) {
            throw new errorHandler_1.AppError('Collect amount must be greater than ₹0.', 400);
        }
        if (collectAmount > prevDue + 0.01) {
            throw new errorHandler_1.AppError(`Collect amount (₹${collectAmount.toFixed(2)}) cannot exceed remaining due amount (₹${prevDue.toFixed(2)}).`, 400);
        }
        const actualCollect = Math.min(collectAmount, prevDue);
        const newPaidAmount = prevPaid + actualCollect;
        const newDueAmount = Math.max(0.00, prevDue - actualCollect);
        const newStatus = newDueAmount <= 0.001 ? 'Paid' : 'Partially Paid';
        const pType = newDueAmount <= 0.001 ? 'Final Settlement' : 'Due Collection';
        const pTimestamp = input.paymentTimestamp ? new Date(input.paymentTimestamp) : new Date();
        const collectorName = typeof currentUser === 'string'
            ? currentUser
            : (currentUser?.name || (currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : 'Staff Member'));
        let noteText = input.notes || '';
        if (input.transactionRef) {
            noteText = noteText ? `${noteText} (Ref: ${input.transactionRef})` : `Ref: ${input.transactionRef}`;
        }
        if (!noteText) {
            noteText = newDueAmount <= 0.001 ? 'Final Settlement Collection' : 'Partial Due Collection';
        }
        // Update invoice
        const updatedInvRes = await client.query(`UPDATE invoices 
       SET amount_paid = $1, due_amount = $2, status = $3, payment_method = $4 
       WHERE invoice_id = $5 RETURNING *`, [newPaidAmount, newDueAmount, newStatus, input.paymentMode, invoiceId]);
        const updatedInvoice = updatedInvRes.rows[0];
        // Insert payment log
        const logRes = await client.query(`INSERT INTO invoice_payment_logs (
        invoice_id, amount_paid, payment_type, payment_mode, payment_timestamp, collected_by, remaining_due_after_txn, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
            invoiceId,
            actualCollect,
            pType,
            input.paymentMode,
            pTimestamp,
            collectorName,
            newDueAmount,
            noteText
        ]);
        // If matching lab order exists, sync order payment status
        if (newDueAmount <= 0.001) {
            const orderNum = `BILL-LAB-${invoiceId.substring(0, 8).toUpperCase()}`;
            await client.query(`UPDATE test_orders SET payment_status = 'Paid' WHERE order_number = $1`, [orderNum]);
        }
        await client.query('COMMIT');
        return {
            invoice: updatedInvoice,
            paymentLog: logRes.rows[0]
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.collectDue = collectDue;
const getAllInvoices = async (filters) => {
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (filters.status) {
        params.push(filters.status);
        whereClause += ` AND i.status = $${params.length}`;
    }
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`, params);
    const dataParams = [...params];
    let limitClause = '';
    if (filters.limit) {
        dataParams.push(filters.limit);
        limitClause += ` LIMIT $${dataParams.length}`;
    }
    if (filters.offset) {
        dataParams.push(filters.offset);
        limitClause += ` OFFSET $${dataParams.length}`;
    }
    const result = await (0, database_1.query)(`SELECT i.*, 
            p.first_name || ' ' || p.last_name as patient_name,
            p.phone as patient_phone,
            p.medical_record_number as patient_mrn,
            p.is_inpatient,
            COALESCE(d.first_name || ' ' || d.last_name, ip_d.first_name || ' ' || ip_d.last_name, 'Hospital Doctor') as doctor_name
     FROM invoices i
     JOIN patients p ON i.patient_id = p.patient_id 
     LEFT JOIN encounters e ON i.encounter_id = e.encounter_id
     LEFT JOIN users d ON e.provider_id = d.user_id
     LEFT JOIN ip_admissions ipa ON i.ip_admission_id = ipa.ip_admission_id
     LEFT JOIN users ip_d ON ipa.admitting_doctor_id = ip_d.user_id
     ${whereClause} 
     ORDER BY i.created_at DESC ${limitClause}`, dataParams);
    return { invoices: result.rows, total: parseInt(countResult.rows[0].total, 10) };
};
exports.getAllInvoices = getAllInvoices;
const getPatientInvoices = async (patientId) => {
    const result = await (0, database_1.query)('SELECT * FROM invoices WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
    return result.rows;
};
exports.getPatientInvoices = getPatientInvoices;
const recordPayment = async (id, input) => {
    const existing = await (0, database_1.query)('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    if (existing.rows.length === 0)
        throw new errorHandler_1.AppError('Invoice not found.', 404);
    const invoice = existing.rows[0];
    const newAmountPaid = parseFloat(invoice.amount_paid) + input.amountPaid;
    const patientResponsibility = parseFloat(invoice.patient_responsibility);
    let newStatus = 'PartiallyPaid';
    if (newAmountPaid >= patientResponsibility)
        newStatus = 'Paid';
    const result = await (0, database_1.query)(`UPDATE invoices SET amount_paid = $1, status = $2, payment_method = $3 WHERE invoice_id = $4 RETURNING *`, [newAmountPaid, newStatus, input.paymentMethod, id]);
    return result.rows[0];
};
exports.recordPayment = recordPayment;
const cancelInvoice = async (id) => {
    const existing = await (0, database_1.query)('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    if (existing.rows.length === 0)
        throw new errorHandler_1.AppError('Invoice not found.', 404);
    const invoice = existing.rows[0];
    if (invoice.status === 'Paid') {
        throw new errorHandler_1.AppError('Cannot cancel a fully paid invoice. Try returning/refunding it instead.', 400);
    }
    const result = await (0, database_1.query)(`UPDATE invoices SET status = 'Cancelled' WHERE invoice_id = $1 RETURNING *`, [id]);
    return result.rows[0];
};
exports.cancelInvoice = cancelInvoice;
const returnInvoice = async (id) => {
    const existing = await (0, database_1.query)('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    if (existing.rows.length === 0)
        throw new errorHandler_1.AppError('Invoice not found.', 404);
    const result = await (0, database_1.query)(`UPDATE invoices SET status = 'Returned', amount_paid = 0.00 WHERE invoice_id = $1 RETURNING *`, [id]);
    return result.rows[0];
};
exports.returnInvoice = returnInvoice;
const updateInvoiceStatus = async (id, status, paymentMethod) => {
    const existing = await (0, database_1.query)('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    if (existing.rows.length === 0)
        throw new errorHandler_1.AppError('Invoice not found.', 404);
    const invoice = existing.rows[0];
    const targetAmountPaid = status === 'Paid' ? parseFloat(invoice.total_amount) : 0.00;
    const result = await (0, database_1.query)(`UPDATE invoices SET amount_paid = $1, status = $2, payment_method = $3 WHERE invoice_id = $4 RETURNING *`, [targetAmountPaid, status, paymentMethod, id]);
    // Sync diagnostic test order payment status if matching
    const orderNum = `BILL-LAB-${id.substring(0, 8).toUpperCase()}`;
    await (0, database_1.query)(`UPDATE test_orders SET payment_status = $1 WHERE order_number = $2`, [status, orderNum]);
    return result.rows[0];
};
exports.updateInvoiceStatus = updateInvoiceStatus;
const getBillingAnalytics = async (options) => {
    let dateFilter = '';
    const params = [];
    const period = options.period || 'month';
    if (period === 'today') {
        dateFilter = "AND i.created_at >= CURRENT_DATE AND i.created_at < CURRENT_DATE + INTERVAL '1 day'";
    }
    else if (period === 'week') {
        dateFilter = "AND i.created_at >= date_trunc('week', CURRENT_DATE) AND i.created_at < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
    }
    else if (period === 'month') {
        dateFilter = "AND i.created_at >= date_trunc('month', CURRENT_DATE) AND i.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
    }
    else if (period === 'year') {
        dateFilter = "AND i.created_at >= date_trunc('year', CURRENT_DATE) AND i.created_at < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
    }
    else if (period === 'custom' && options.startDate && options.endDate) {
        params.push(options.startDate);
        params.push(options.endDate + ' 23:59:59');
        dateFilter = `AND i.created_at >= $1 AND i.created_at <= $2`;
    }
    // Summary Metrics Query
    const summaryRes = await (0, database_1.query)(`
    SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(i.total_amount), 0) as total_revenue,
      COALESCE(SUM(i.amount_paid), 0) as total_amount_paid,
      COALESCE(SUM(i.total_amount - i.amount_paid), 0) as total_pending_amount,
      
      COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) as paid_invoices_count,
      COUNT(CASE WHEN i.status = 'Unpaid' THEN 1 END) as unpaid_invoices_count,
      COUNT(CASE WHEN i.status = 'PartiallyPaid' THEN 1 END) as partial_invoices_count,
      COUNT(CASE WHEN i.status = 'Cancelled' THEN 1 END) as cancelled_invoices_count,
      
      -- Payment Method Breakdown
      COUNT(CASE WHEN LOWER(i.payment_method) = 'cash' THEN 1 END) as cash_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'cash' THEN i.amount_paid ELSE 0 END), 0) as cash_amount,
      
      COUNT(CASE WHEN LOWER(i.payment_method) = 'upi' THEN 1 END) as upi_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'upi' THEN i.amount_paid ELSE 0 END), 0) as upi_amount,
      
      COUNT(CASE WHEN LOWER(i.payment_method) = 'card' THEN 1 END) as card_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'card' THEN i.amount_paid ELSE 0 END), 0) as card_amount,

      COUNT(CASE WHEN LOWER(i.payment_method) = 'bank transfer' THEN 1 END) as bank_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'bank transfer' THEN i.amount_paid ELSE 0 END), 0) as bank_amount,
      
      COUNT(CASE WHEN LOWER(i.payment_method) = 'insurance' OR i.insurance_coverage > 0 THEN 1 END) as insurance_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'insurance' THEN i.amount_paid ELSE i.insurance_coverage END), 0) as insurance_amount,
      
      -- IP vs OP Breakdown
      COUNT(CASE WHEN p.is_inpatient = true OR i.ip_admission_id IS NOT NULL THEN 1 END) as ip_invoices_count,
      COALESCE(SUM(CASE WHEN p.is_inpatient = true OR i.ip_admission_id IS NOT NULL THEN i.total_amount ELSE 0 END), 0) as ip_amount,
      
      COUNT(CASE WHEN p.is_inpatient = false AND i.ip_admission_id IS NULL THEN 1 END) as op_invoices_count,
      COALESCE(SUM(CASE WHEN p.is_inpatient = false AND i.ip_admission_id IS NULL THEN i.total_amount ELSE 0 END), 0) as op_amount

    FROM invoices i
    JOIN patients p ON i.patient_id = p.patient_id
    WHERE 1=1 ${dateFilter}
  `, params);
    // Daily Trend Breakdown
    const trendRes = await (0, database_1.query)(`
    SELECT 
      TO_CHAR(i.created_at, 'YYYY-MM-DD') as date_label,
      COUNT(*) as invoice_count,
      COALESCE(SUM(i.total_amount), 0) as total_amount,
      COALESCE(SUM(i.amount_paid), 0) as amount_paid,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'cash' THEN i.amount_paid ELSE 0 END), 0) as cash_amount,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'upi' THEN i.amount_paid ELSE 0 END), 0) as upi_amount,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'card' THEN i.amount_paid ELSE 0 END), 0) as card_amount,
      COALESCE(SUM(CASE WHEN p.is_inpatient = true OR i.ip_admission_id IS NOT NULL THEN i.total_amount ELSE 0 END), 0) as ip_amount
    FROM invoices i
    JOIN patients p ON i.patient_id = p.patient_id
    WHERE 1=1 ${dateFilter}
    GROUP BY TO_CHAR(i.created_at, 'YYYY-MM-DD')
    ORDER BY date_label ASC
  `, params);
    const row = summaryRes.rows[0] || {};
    return {
        period,
        totalInvoices: parseInt(row.total_invoices, 10) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        totalAmountPaid: parseFloat(row.total_amount_paid) || 0,
        totalPendingAmount: parseFloat(row.total_pending_amount) || 0,
        paidInvoicesCount: parseInt(row.paid_invoices_count, 10) || 0,
        unpaidInvoicesCount: parseInt(row.unpaid_invoices_count, 10) || 0,
        partialInvoicesCount: parseInt(row.partial_invoices_count, 10) || 0,
        cancelledInvoicesCount: parseInt(row.cancelled_invoices_count, 10) || 0,
        cashCount: parseInt(row.cash_count, 10) || 0,
        cashAmount: parseFloat(row.cash_amount) || 0,
        upiCount: parseInt(row.upi_count, 10) || 0,
        upiAmount: parseFloat(row.upi_amount) || 0,
        cardCount: parseInt(row.card_count, 10) || 0,
        cardAmount: parseFloat(row.card_amount) || 0,
        bankCount: parseInt(row.bank_count, 10) || 0,
        bankAmount: parseFloat(row.bank_amount) || 0,
        insuranceCount: parseInt(row.insurance_count, 10) || 0,
        insuranceAmount: parseFloat(row.insurance_amount) || 0,
        ipInvoicesCount: parseInt(row.ip_invoices_count, 10) || 0,
        ipAmount: parseFloat(row.ip_amount) || 0,
        opInvoicesCount: parseInt(row.op_invoices_count, 10) || 0,
        opAmount: parseFloat(row.op_amount) || 0,
        dailyTrends: trendRes.rows.map(r => ({
            date: r.date_label,
            invoiceCount: parseInt(r.invoice_count, 10) || 0,
            totalAmount: parseFloat(r.total_amount) || 0,
            amountPaid: parseFloat(r.amount_paid) || 0,
            cashAmount: parseFloat(r.cash_amount) || 0,
            upiAmount: parseFloat(r.upi_amount) || 0,
            cardAmount: parseFloat(r.card_amount) || 0,
            ipAmount: parseFloat(r.ip_amount) || 0
        }))
    };
};
exports.getBillingAnalytics = getBillingAnalytics;
//# sourceMappingURL=invoice.service.js.map