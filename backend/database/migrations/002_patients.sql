CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(5),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    allergies TEXT,
    assigned_doctor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE mrn_seq START 10001;
