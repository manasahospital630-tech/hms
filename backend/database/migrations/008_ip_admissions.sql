-- Alter existing patient table to support real-time state flags
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_inpatient BOOLEAN DEFAULT FALSE;

-- =========================================================================
-- SYSTEM ADDITIONS: BED MANAGEMENT & WARDS
-- =========================================================================
DO $$ BEGIN
    CREATE TYPE ward_type AS ENUM ('Emergency', 'ICU', 'General_Ward', 'Semi_Private', 'Private_Suite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bed_status AS ENUM ('Available', 'Occupied', 'Maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS hospital_beds (
    bed_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_number VARCHAR(20) NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    type ward_type NOT NULL,
    status bed_status DEFAULT 'Available',
    per_day_charge NUMERIC(10,2) NOT NULL,
    UNIQUE(ward_name, bed_number)
);

-- =========================================================================
-- SYSTEM ADDITIONS: IP ADMISSION RECORDS
-- =========================================================================
DO $$ BEGIN
    CREATE TYPE admission_type AS ENUM ('Emergency', 'Routine_IP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admission_status AS ENUM ('Admitted', 'Transferred', 'Discharged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ip_admissions (
    ip_admission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE RESTRICT,
    admission_type admission_type NOT NULL,
    status admission_status DEFAULT 'Admitted',
    admitting_doctor_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    current_bed_id UUID REFERENCES hospital_beds(bed_id) ON DELETE RESTRICT,
    reason_for_admission TEXT NOT NULL,
    admitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- SYSTEM ADDITIONS: SHIFTING / TRANSFER LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS ip_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_admission_id UUID REFERENCES ip_admissions(ip_admission_id) ON DELETE CASCADE,
    from_bed_id UUID REFERENCES hospital_beds(bed_id),
    to_bed_id UUID REFERENCES hospital_beds(bed_id),
    transferred_by UUID REFERENCES users(user_id),
    transfer_reason TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- UPDATED BILLING ROUTE: LINKING PHARMA/LAB DIRECTLY TO THE IP RUNNING LEDGER
-- =========================================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ip_admission_id UUID REFERENCES ip_admissions(ip_admission_id) ON DELETE SET NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS ip_admission_id UUID REFERENCES ip_admissions(ip_admission_id) ON DELETE SET NULL;

-- Also let's link encounters to ip_admissions for Emergency Consultations
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS ip_admission_id UUID REFERENCES ip_admissions(ip_admission_id) ON DELETE SET NULL;
