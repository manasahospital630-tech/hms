"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.givePortalAccess = exports.updatePatient = exports.getPatientById = exports.getPatients = exports.createPatient = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
const mrnGenerator_1 = require("../../utils/mrnGenerator");
const errorHandler_1 = require("../../middleware/errorHandler");
const createPatient = async (input) => {
    const mrn = await (0, mrnGenerator_1.generateMRN)();
    const result = await (0, database_1.query)(`INSERT INTO patients (
      user_id, medical_record_number, first_name, last_name, date_of_birth, gender,
      blood_group, address, phone, email, emergency_contact_name, emergency_contact_phone,
      insurance_provider, insurance_policy_number, allergies, assigned_doctor_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`, [
        input.userId || null,
        mrn,
        input.firstName,
        input.lastName,
        input.dateOfBirth,
        input.gender,
        input.bloodGroup || null,
        input.address || null,
        input.phone || null,
        input.email || null,
        input.emergencyContactName || null,
        input.emergencyContactPhone || null,
        input.insuranceProvider || null,
        input.insurancePolicyNumber || null,
        input.allergies || null,
        input.assignedDoctorId || null,
    ]);
    return result.rows[0];
};
exports.createPatient = createPatient;
const getPatients = async (options) => {
    const { search, limit = 25, offset = 0 } = options;
    let whereClause = '';
    const params = [];
    if (search) {
        params.push(`%${search}%`);
        whereClause = `WHERE p.first_name || ' ' || p.last_name ILIKE $1 OR p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.medical_record_number ILIKE $1 OR p.phone ILIKE $1`;
    }
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM patients p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total, 10);
    const dataParams = [...params, limit, offset];
    const result = await (0, database_1.query)(`SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.assigned_doctor_id = d.user_id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, dataParams);
    return {
        patients: result.rows,
        pagination: {
            total,
            limit,
            offset,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getPatients = getPatients;
const getPatientById = async (patientId) => {
    const result = await (0, database_1.query)(`SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.assigned_doctor_id = d.user_id
     WHERE p.patient_id = $1`, [patientId]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Patient not found.', 404);
    }
    return result.rows[0];
};
exports.getPatientById = getPatientById;
const updatePatient = async (patientId, input) => {
    // First check that patient exists
    const existing = await (0, database_1.query)('SELECT patient_id FROM patients WHERE patient_id = $1', [patientId]);
    if (existing.rows.length === 0) {
        throw new errorHandler_1.AppError('Patient not found.', 404);
    }
    // Build dynamic SET clause
    const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        dateOfBirth: 'date_of_birth',
        gender: 'gender',
        bloodGroup: 'blood_group',
        address: 'address',
        phone: 'phone',
        email: 'email',
        emergencyContactName: 'emergency_contact_name',
        emergencyContactPhone: 'emergency_contact_phone',
        insuranceProvider: 'insurance_provider',
        insurancePolicyNumber: 'insurance_policy_number',
        allergies: 'allergies',
        assignedDoctorId: 'assigned_doctor_id',
    };
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, column] of Object.entries(fieldMap)) {
        if (input[key] !== undefined) {
            setClauses.push(`${column} = $${paramIndex}`);
            values.push(input[key]);
            paramIndex++;
        }
    }
    if (setClauses.length === 0) {
        throw new errorHandler_1.AppError('No fields to update.', 400);
    }
    values.push(patientId);
    const result = await (0, database_1.query)(`UPDATE patients SET ${setClauses.join(', ')} WHERE patient_id = $${paramIndex} RETURNING *`, values);
    return result.rows[0];
};
exports.updatePatient = updatePatient;
const givePortalAccess = async (patientId) => {
    const patient = await (0, exports.getPatientById)(patientId);
    if (patient.user_id) {
        throw new errorHandler_1.AppError('Patient already has portal access.', 400);
    }
    if (!patient.email) {
        throw new errorHandler_1.AppError('Patient must have an email address to activate portal access.', 400);
    }
    // Check if user already exists
    const existingUserRes = await (0, database_1.query)('SELECT user_id, role FROM users WHERE email = $1', [patient.email]);
    let userId;
    const defaultPassword = `Patient@${patient.medical_record_number.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (existingUserRes.rows.length > 0) {
        const user = existingUserRes.rows[0];
        if (user.role !== 'Patient') {
            throw new errorHandler_1.AppError('This email is already in use by a staff account.', 400);
        }
        userId = user.user_id;
    }
    else {
        // Create new patient user
        const passwordHash = await bcryptjs_1.default.hash(defaultPassword, 12);
        const userRes = await (0, database_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'Patient') RETURNING user_id`, [patient.email, passwordHash, patient.first_name, patient.last_name]);
        userId = userRes.rows[0].user_id;
    }
    // Link user to patient
    await (0, database_1.query)('UPDATE patients SET user_id = $1 WHERE patient_id = $2', [userId, patientId]);
    return {
        email: patient.email,
        password: defaultPassword
    };
};
exports.givePortalAccess = givePortalAccess;
//# sourceMappingURL=patient.service.js.map