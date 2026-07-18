CREATE TABLE inventory_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    manufacturer VARCHAR(200),
    stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    reorder_level INT NOT NULL DEFAULT 50,
    unit_price NUMERIC(10,2) NOT NULL,
    expiry_date DATE NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    batch_no VARCHAR(100) NOT NULL,
    rack_no VARCHAR(50) NOT NULL,
    purchase_price NUMERIC(10,2) NOT NULL,
    is_sheet BOOLEAN NOT NULL DEFAULT FALSE,
    tablets_per_sheet INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    dispensed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    dispensed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE prescription_items (
    prescription_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(item_id) ON DELETE RESTRICT,
    dosage_instruction VARCHAR(255) NOT NULL,
    quantity_prescribed INT NOT NULL
);
