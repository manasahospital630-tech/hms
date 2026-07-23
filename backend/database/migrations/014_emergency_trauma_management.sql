CREATE TABLE IF NOT EXISTS emergency_admissions (
    emergency_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_tracking_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    is_unknown BOOLEAN DEFAULT FALSE,
    estimated_age VARCHAR(20),
    physical_marks TEXT,
    belongings_inventory TEXT,
    is_mlc BOOLEAN DEFAULT FALSE,
    mlc_category VARCHAR(50), -- 'RTA', 'SUICIDE_ATTEMPT', 'ASSAULT', 'POISONING', 'INDUSTRIAL', etc.
    triage_priority VARCHAR(20) DEFAULT 'RED', -- 'RED', 'ORANGE', 'YELLOW', 'GREEN'
    brought_by_name VARCHAR(150),
    brought_by_phone VARCHAR(50),
    brought_by_relation VARCHAR(100),
    police_badge_number VARCHAR(50),
    police_station VARCHAR(150),
    police_officer_name VARCHAR(150),
    police_informed BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'IN_ER_CARE', -- 'IN_ER_CARE', 'IP_TRANSFERRED', 'DISCHARGED', 'MORTUARY'
    current_bed_id UUID REFERENCES hospital_beds(bed_id) ON DELETE SET NULL,
    admitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS emergency_consents (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id UUID REFERENCES emergency_admissions(emergency_id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'HIGH_RISK', 'POLICE_INTIMATION', 'BROUGHT_BY_WITNESS', 'SELF_HARM_DECLARATION', 'LAMA'
    signatory_name VARCHAR(150) NOT NULL,
    relation VARCHAR(100),
    signature_data_url TEXT NOT NULL, -- Base64 PNG signature
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_vitals_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id UUID REFERENCES emergency_admissions(emergency_id) ON DELETE CASCADE,
    bp_sys INTEGER,
    bp_dia INTEGER,
    pulse INTEGER,
    spo2 INTEGER,
    respiratory_rate INTEGER,
    gcs_score INTEGER, -- Glasgow Coma Scale (3-15)
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id UUID REFERENCES emergency_admissions(emergency_id) ON DELETE CASCADE,
    order_type VARCHAR(50) NOT NULL, -- 'MEDICATION', 'IV_FLUIDS', 'BLOOD_BANK', 'RADIOLOGY'
    details TEXT NOT NULL, -- e.g. "Adrenaline STAT"
    ordered_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Administered', 'Completed'
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
