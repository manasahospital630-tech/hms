"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTriageVitals = exports.checkReviewStatus = exports.createOPCheckIn = exports.updateAppointmentStatus = exports.getAppointmentById = exports.getAppointments = exports.createAppointment = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const createAppointment = async (input) => {
    const apptDateStr = input.appointmentDate
        ? new Date(input.appointmentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
    // 1. Calculate next OP No for that date
    const opRes = await (0, database_1.query)(`SELECT MAX(op_no) as max_op FROM appointments WHERE DATE(appointment_date) = $1`, [apptDateStr]);
    const maxOp = opRes.rows[0]?.max_op;
    const opNo = maxOp ? parseInt(maxOp, 10) + 1 : 1014;
    // 2. Calculate next Token No for that doctor on that date (sequential: 1, 2, 3...)
    const tokenRes = await (0, database_1.query)(`SELECT MAX(token_no) as max_token FROM appointments WHERE doctor_id = $1 AND DATE(appointment_date) = $2`, [input.doctorId, apptDateStr]);
    const maxToken = tokenRes.rows[0]?.max_token;
    const tokenNo = maxToken ? parseInt(maxToken, 10) + 1 : 1;
    const result = await (0, database_1.query)(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, symptoms_brief, notes, op_no, token_no)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [input.patientId, input.doctorId, input.appointmentDate, input.symptomsBrief || null, input.notes || null, opNo, tokenNo]);
    return result.rows[0];
};
exports.createAppointment = createAppointment;
const getAppointments = async (filters) => {
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (filters.doctorId) {
        params.push(filters.doctorId);
        whereClause += ` AND a.doctor_id = $${params.length}`;
    }
    if (filters.status) {
        params.push(filters.status);
        whereClause += ` AND a.status = $${params.length}`;
    }
    if (filters.date) {
        params.push(filters.date);
        whereClause += ` AND DATE(a.appointment_date) = $${params.length}`;
    }
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM appointments a ${whereClause}`, params);
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
    const result = await (0, database_1.query)(`SELECT a.*,
            p.first_name || ' ' || p.last_name as patient_name,
            p.medical_record_number,
            p.phone as patient_phone,
            p.date_of_birth,
            p.gender,
            p.age,
            u.first_name || ' ' || u.last_name as doctor_name,
            dp.department as doctor_department,
            COALESCE(dp.consultation_fee, 0.00) as doctor_fee
     FROM appointments a
     JOIN patients p ON a.patient_id = p.patient_id
     JOIN users u ON a.doctor_id = u.user_id
     LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
     ${whereClause}
     ORDER BY a.appointment_date DESC, a.created_at DESC
     ${limitClause}`, dataParams);
    return {
        appointments: result.rows,
        total: parseInt(countResult.rows[0].total, 10),
    };
};
exports.getAppointments = getAppointments;
const getAppointmentById = async (id) => {
    const result = await (0, database_1.query)(`SELECT a.*,
            p.first_name || ' ' || p.last_name as patient_name,
            p.medical_record_number,
            u.first_name || ' ' || u.last_name as doctor_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.patient_id
     JOIN users u ON a.doctor_id = u.user_id
     WHERE a.appointment_id = $1`, [id]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Appointment not found.', 404);
    return result.rows[0];
};
exports.getAppointmentById = getAppointmentById;
const updateAppointmentStatus = async (id, status) => {
    const existing = await (0, database_1.query)('SELECT status FROM appointments WHERE appointment_id = $1', [id]);
    if (existing.rows.length === 0)
        throw new errorHandler_1.AppError('Appointment not found.', 404);
    const result = await (0, database_1.query)('UPDATE appointments SET status = $1 WHERE appointment_id = $2 RETURNING *', [status, id]);
    return result.rows[0];
};
exports.updateAppointmentStatus = updateAppointmentStatus;
const createOPCheckIn = async (input) => {
    const { patientId, doctorId, paymentMethod } = input;
    // 1. Fetch doctor profile (fee & department)
    const docProfileRes = await (0, database_1.query)(`SELECT dp.department, dp.consultation_fee, u.first_name, u.last_name
     FROM users u
     LEFT JOIN doctor_profiles dp ON u.user_id = dp.doctor_id
     WHERE u.user_id = $1 AND u.role = 'Doctor'`, [doctorId]);
    if (docProfileRes.rows.length === 0) {
        throw new errorHandler_1.AppError('Doctor not found or profile is not configured.', 404);
    }
    const docInfo = docProfileRes.rows[0];
    const originalFee = parseFloat(docInfo.consultation_fee || '0.00');
    // 2. Check for completed/checked-in appointments in the last 7 days for the same doctor
    const recentApptRes = await (0, database_1.query)(`SELECT appointment_id, appointment_date
     FROM appointments
     WHERE patient_id = $1
       AND doctor_id = $2
       AND status IN ('CheckedIn', 'InConsultation', 'Completed')
       AND appointment_date >= NOW() - INTERVAL '7 days'
     ORDER BY appointment_date DESC
     LIMIT 1`, [patientId, doctorId]);
    const isFreeReview = recentApptRes.rows.length > 0;
    const chargedFee = isFreeReview ? 0.00 : originalFee;
    // 3. Begin Transaction
    await (0, database_1.query)('BEGIN');
    try {
        // Max op_no today
        const opRes = await (0, database_1.query)(`SELECT MAX(op_no) as max_op FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE`);
        const maxOp = opRes.rows[0]?.max_op;
        const opNo = maxOp ? parseInt(maxOp, 10) + 1 : 1014;
        // Max token_no for this doctor today (Sequential: 1, 2, 3, 4...)
        const tokenRes = await (0, database_1.query)(`SELECT MAX(token_no) as max_token FROM appointments 
       WHERE doctor_id = $1 AND DATE(appointment_date) = CURRENT_DATE`, [doctorId]);
        const maxToken = tokenRes.rows[0]?.max_token;
        const tokenNo = maxToken ? parseInt(maxToken, 10) + 1 : 1;
        // 4. Create appointment with immutable op_no & token_no saved permanently in DB!
        const apptRes = await (0, database_1.query)(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, symptoms_brief, notes, op_no, token_no)
       VALUES ($1, $2, NOW(), 'CheckedIn', 'OPD Consultation Check-in', $3, $4, $5) RETURNING *`, [patientId, doctorId, isFreeReview ? 'Free 7-day review consultation' : 'Paid consultation', opNo, tokenNo]);
        const appointment = apptRes.rows[0];
        // 5. Create invoice
        const invoiceRes = await (0, database_1.query)(`INSERT INTO invoices (patient_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, status, payment_method, notes)
       VALUES ($1, $2, 0.00, 0.00, 0.00, $2, $2, 'Paid', $3, $4) RETURNING *`, [patientId, chargedFee, paymentMethod, `OPD Consultation Invoice for Dr. ${docInfo.first_name} ${docInfo.last_name}`]);
        const invoice = invoiceRes.rows[0];
        // 6. Create invoice item
        await (0, database_1.query)(`INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price)
       VALUES ($1, $2, 'Consultation', 1, $3)`, [
            invoice.invoice_id,
            `OPD Consultation - Dr. ${docInfo.first_name} ${docInfo.last_name} (${docInfo.department || 'General'})`,
            chargedFee
        ]);
        const billNo = `OP${new Date().getFullYear().toString().substring(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${invoice.invoice_id.substring(0, 4).toUpperCase()}`;
        // Update appointment with bill_no
        await (0, database_1.query)(`UPDATE appointments SET bill_no = $1 WHERE appointment_id = $2`, [billNo, appointment.appointment_id]);
        appointment.bill_no = billNo;
        await (0, database_1.query)('COMMIT');
        return {
            appointment,
            invoice,
            isFreeReview,
            chargedFee,
            doctorName: `${docInfo.first_name} ${docInfo.last_name}`,
            department: docInfo.department || 'General',
            opNo,
            tokenNo,
            billNo
        };
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.createOPCheckIn = createOPCheckIn;
const checkReviewStatus = async (patientId, doctorId) => {
    const result = await (0, database_1.query)(`SELECT appointment_date
     FROM appointments
     WHERE patient_id = $1
       AND doctor_id = $2
       AND status IN ('CheckedIn', 'InConsultation', 'Completed')
       AND appointment_date >= NOW() - INTERVAL '7 days'
     ORDER BY appointment_date DESC
     LIMIT 1`, [patientId, doctorId]);
    if (result.rows.length === 0) {
        return { isFreeReview: false, lastAppointmentDate: null };
    }
    return {
        isFreeReview: true,
        lastAppointmentDate: result.rows[0].appointment_date
    };
};
exports.checkReviewStatus = checkReviewStatus;
const recordTriageVitals = async (input) => {
    const apptId = input.appointmentId || input.bookingId;
    const { patientId, weight, temperature, heartRate, oxygenSaturation, bloodPressureSystolic, bloodPressureDiastolic, glucoseLevel, glucoseType = 'Random', notes, } = input;
    const recordedAt = new Date().toISOString();
    const vitalRecord = {
        recordedAt,
        weight: weight !== undefined && weight !== '' && !isNaN(Number(weight)) ? Number(weight) : 165,
        temperature: temperature !== undefined && temperature !== '' && !isNaN(Number(temperature)) ? Number(temperature) : 99.4,
        heartRate: heartRate !== undefined && heartRate !== '' && !isNaN(Number(heartRate)) ? Number(heartRate) : 140,
        oxygenSaturation: oxygenSaturation !== undefined && oxygenSaturation !== '' && !isNaN(Number(oxygenSaturation)) ? Number(oxygenSaturation) : 94,
        bloodPressure: {
            systolic: bloodPressureSystolic !== undefined && bloodPressureSystolic !== '' && !isNaN(Number(bloodPressureSystolic)) ? Number(bloodPressureSystolic) : 120,
            diastolic: bloodPressureDiastolic !== undefined && bloodPressureDiastolic !== '' && !isNaN(Number(bloodPressureDiastolic)) ? Number(bloodPressureDiastolic) : 80,
        },
        glucoseLevel: glucoseLevel !== undefined && glucoseLevel !== '' && !isNaN(Number(glucoseLevel)) ? Number(glucoseLevel) : 110,
        glucoseType,
        notes: notes || '',
    };
    let apptRow = null;
    if (apptId) {
        const apptRes = await (0, database_1.query)(`UPDATE appointments 
       SET vitals = $1::jsonb, has_vitals_recorded = TRUE 
       WHERE appointment_id = $2 
       RETURNING *`, [JSON.stringify(vitalRecord), apptId]);
        if (apptRes.rows.length > 0) {
            apptRow = apptRes.rows[0];
        }
    }
    // Auto-Sync to Patient Master Timeline in DB
    const patRes = await (0, database_1.query)(`SELECT current_vitals, vitals_history FROM patients WHERE patient_id = $1`, [patientId]);
    if (patRes.rows.length > 0) {
        let history = patRes.rows[0].vitals_history || [];
        if (!Array.isArray(history))
            history = [];
        history.push(vitalRecord);
        await (0, database_1.query)(`UPDATE patients 
       SET current_vitals = $1::jsonb, vitals_history = $2::jsonb 
       WHERE patient_id = $3`, [JSON.stringify(vitalRecord), JSON.stringify(history), patientId]);
    }
    return {
        appointment: apptRow,
        vitalRecord,
    };
};
exports.recordTriageVitals = recordTriageVitals;
//# sourceMappingURL=appointment.service.js.map