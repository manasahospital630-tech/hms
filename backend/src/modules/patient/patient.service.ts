import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { generateMRN } from '../../utils/mrnGenerator';
import { CreatePatientInput, UpdatePatientInput } from './patient.schema';
import { AppError } from '../../middleware/errorHandler';

export const createPatient = async (input: CreatePatientInput) => {
  const mrn = await generateMRN();

  let ageVal: number | null = null;
  if (input.age !== undefined && input.age !== null && input.age !== '') {
    ageVal = parseInt(String(input.age), 10);
  }

  let dob = input.dateOfBirth;
  if (!dob && ageVal !== null && !isNaN(ageVal)) {
    const currentYear = new Date().getFullYear();
    dob = `${currentYear - ageVal}-01-01`;
  }
  if (!dob) {
    dob = '1990-01-01';
  }

  const result = await query(
    `INSERT INTO patients (
      user_id, medical_record_number, first_name, last_name, date_of_birth, age, gender,
      blood_group, address, phone, email, emergency_contact_name, emergency_contact_phone,
      insurance_provider, insurance_policy_number, allergies, assigned_doctor_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      input.userId || null,
      mrn,
      input.firstName,
      input.lastName,
      dob,
      ageVal,
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
    ]
  );

  return result.rows[0];
};

export const getPatients = async (options: {
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const { search, limit = 25, offset = 0 } = options;
  let whereClause = '';
  const params: any[] = [];

  if (search) {
    params.push(`%${search}%`);
    whereClause = `WHERE p.first_name || ' ' || p.last_name ILIKE $1 OR p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.medical_record_number ILIKE $1 OR p.phone ILIKE $1`;
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM patients p ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total, 10);

  const dataParams = [...params, limit, offset];
  const result = await query(
    `SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.assigned_doctor_id = d.user_id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams
  );

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

export const getPatientById = async (patientId: string) => {
  const result = await query(
    `SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.assigned_doctor_id = d.user_id
     WHERE p.patient_id = $1`,
    [patientId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Patient not found.', 404);
  }

  return result.rows[0];
};

export const updatePatient = async (patientId: string, input: UpdatePatientInput) => {
  // First check that patient exists
  const existing = await query('SELECT patient_id FROM patients WHERE patient_id = $1', [patientId]);
  if (existing.rows.length === 0) {
    throw new AppError('Patient not found.', 404);
  }

  // Build dynamic SET clause
  const fieldMap: Record<string, string> = {
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

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, column] of Object.entries(fieldMap)) {
    if ((input as any)[key] !== undefined) {
      setClauses.push(`${column} = $${paramIndex}`);
      values.push((input as any)[key]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new AppError('No fields to update.', 400);
  }

  values.push(patientId);

  const result = await query(
    `UPDATE patients SET ${setClauses.join(', ')} WHERE patient_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const givePortalAccess = async (patientId: string) => {
  const patient = await getPatientById(patientId);
  if (patient.user_id) {
    throw new AppError('Patient already has portal access.', 400);
  }
  if (!patient.email) {
    throw new AppError('Patient must have an email address to activate portal access.', 400);
  }

  // Check if user already exists
  const existingUserRes = await query('SELECT user_id, role FROM users WHERE email = $1', [patient.email]);
  let userId: string;
  const defaultPassword = `Patient@${patient.medical_record_number.replace(/[^a-zA-Z0-9]/g, '')}`;

  if (existingUserRes.rows.length > 0) {
    const user = existingUserRes.rows[0];
    if (user.role !== 'Patient') {
      throw new AppError('This email is already in use by a staff account.', 400);
    }
    userId = user.user_id;
  } else {
    // Create new patient user
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const userRes = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'Patient') RETURNING user_id`,
      [patient.email, passwordHash, patient.first_name, patient.last_name]
    );
    userId = userRes.rows[0].user_id;
  }

  // Link user to patient
  await query('UPDATE patients SET user_id = $1 WHERE patient_id = $2', [userId, patientId]);

  return {
    email: patient.email,
    password: defaultPassword
  };
};
