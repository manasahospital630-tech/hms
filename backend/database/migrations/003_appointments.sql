CREATE TYPE appointment_status AS ENUM ('Scheduled', 'CheckedIn', 'InConsultation', 'Completed', 'Cancelled');

CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'Scheduled',
    symptoms_brief TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
