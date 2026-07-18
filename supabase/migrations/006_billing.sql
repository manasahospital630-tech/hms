CREATE TYPE invoice_status AS ENUM ('Unpaid', 'PartiallyPaid', 'Paid', 'WrittenOff');

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounters(encounter_id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    insurance_coverage NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    patient_responsibility NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status invoice_status DEFAULT 'Unpaid',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    invoice_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
