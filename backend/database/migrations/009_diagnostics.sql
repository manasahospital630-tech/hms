-- =========================================================================
-- SYSTEM ADDITIONS: DIAGNOSTICS MODULE TABLES
-- =========================================================================

-- Support employee registration fields inside users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_specialization VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reporting_manager UUID REFERENCES users(user_id) ON DELETE SET NULL;

-- 1. Referral Doctors
CREATE TABLE IF NOT EXISTS referral_doctors (
    referral_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    hospital VARCHAR(255),
    commission_percentage NUMERIC(5,2) DEFAULT 0.00,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Diagnostic Categories
CREATE TABLE IF NOT EXISTS diagnostic_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Diagnostic Services (Tests Catalog)
CREATE TABLE IF NOT EXISTS diagnostic_services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES diagnostic_categories(category_id) ON DELETE SET NULL,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    gst_percentage NUMERIC(5,2) DEFAULT 0.00,
    duration_minutes INT DEFAULT 30,
    sample_required VARCHAR(100),
    normal_range TEXT,
    machine_required VARCHAR(100),
    home_collection_available BOOLEAN DEFAULT FALSE,
    emergency_available BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Diagnostic Packages
CREATE TABLE IF NOT EXISTS diagnostic_packages (
    package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    validity_days INT DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Diagnostic Package Items
CREATE TABLE IF NOT EXISTS diagnostic_package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES diagnostic_packages(package_id) ON DELETE CASCADE,
    service_id UUID REFERENCES diagnostic_services(service_id) ON DELETE CASCADE,
    UNIQUE(package_id, service_id)
);

-- 6. Machines
CREATE TABLE IF NOT EXISTS machines (
    machine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    calibration_date DATE,
    maintenance_date DATE,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Machine Maintenance
CREATE TABLE IF NOT EXISTS machine_maintenance (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(machine_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    done_by VARCHAR(255),
    notes TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Test Orders
CREATE TABLE IF NOT EXISTS test_orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    referral_id UUID REFERENCES referral_doctors(referral_id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'Routine',
    clinical_notes TEXT,
    diagnosis TEXT,
    payment_status VARCHAR(20) DEFAULT 'Unpaid',
    status VARCHAR(50) DEFAULT 'Ordered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Test Order Items
CREATE TABLE IF NOT EXISTS test_order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES test_orders(order_id) ON DELETE CASCADE,
    service_id UUID REFERENCES diagnostic_services(service_id) ON DELETE RESTRICT,
    package_id UUID REFERENCES diagnostic_packages(package_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Ordered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Sample Collections
CREATE TABLE IF NOT EXISTS sample_collections (
    sample_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES test_order_items(item_id) ON DELETE CASCADE,
    collected_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    container_type VARCHAR(100),
    barcode VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'Collected',
    remarks TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Lab Results
CREATE TABLE IF NOT EXISTS lab_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES test_order_items(item_id) ON DELETE CASCADE,
    entered_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(machine_id) ON DELETE SET NULL,
    actual_result TEXT NOT NULL,
    reference_range TEXT,
    status VARCHAR(20) DEFAULT 'Normal',
    machine_reading TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Radiology Reports
CREATE TABLE IF NOT EXISTS radiology_reports (
    radiology_report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES test_order_items(item_id) ON DELETE CASCADE,
    radiographer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    radiologist_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    image_urls TEXT[],
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    conclusion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Ultrasound Reports
CREATE TABLE IF NOT EXISTS ultrasound_reports (
    ultrasound_report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES test_order_items(item_id) ON DELETE CASCADE,
    sonologist_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    clinical_history TEXT,
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. ECG Reports
CREATE TABLE IF NOT EXISTS ecg_reports (
    ecg_report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES test_order_items(item_id) ON DELETE CASCADE,
    operator_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    graph_url TEXT,
    findings TEXT NOT NULL,
    interpretation TEXT NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Report Verifications
CREATE TABLE IF NOT EXISTS report_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES test_order_items(item_id) ON DELETE CASCADE,
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    digital_signature_used TEXT,
    status VARCHAR(20) DEFAULT 'Approved',
    notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Quality Control Logs
CREATE TABLE IF NOT EXISTS quality_control_logs (
    qc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(machine_id) ON DELETE CASCADE,
    qc_parameter VARCHAR(255) NOT NULL,
    expected_value VARCHAR(100),
    actual_value VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pass',
    logged_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Diagnostic Billing & Commissions
CREATE TABLE IF NOT EXISTS diagnostic_billing (
    billing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES test_orders(order_id) ON DELETE CASCADE,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    gst NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    referral_commission_amount NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
