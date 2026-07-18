CREATE TABLE encounters (
    encounter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    encounter_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    systolic_bp INT,
    diastolic_bp INT,
    pulse_rate INT,
    temperature_celsius NUMERIC(4,2),
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    spo2 INT,
    chief_complaint TEXT NOT NULL,
    soap_subjective TEXT,
    soap_objective TEXT,
    soap_assessment TEXT,
    soap_plan TEXT,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    icd_code VARCHAR(15) NOT NULL,
    description TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
