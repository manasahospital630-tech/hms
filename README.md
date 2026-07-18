# 🏥 Hannah HMS

## Enterprise Hospital Management System & Electronic Medical Records (EMR)

Hannah HMS is a comprehensive, enterprise-grade Hospital Management System with integrated Electronic Medical Records, built on a modern full-stack architecture with strict Role-Based Access Control (RBAC).

---

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js · TypeScript · Express |
| **Frontend** | React 18 · TypeScript · Vite |
| **Database** | PostgreSQL (Supabase compatible) |
| **Auth** | JWT (jsonwebtoken) · bcrypt |
| **Validation** | Zod |

### System Design

```
Client Applications (Web / Mobile / Tablet)
                    │
                    ▼
        API Gateway & Auth Service
        (JWT · RBAC · TLS · Rate Limiting)
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐  ┌───────────┐  ┌───────────┐
│ OPD &   │  │ EMR Core  │  │ Pharmacy  │
│ Sched.  │  │ Clinical  │  │ & Billing │
└─────────┘  └───────────┘  └───────────┘
                    │
                    ▼
        PostgreSQL (Encrypted at Rest)
```

---

## 👥 Role-Based Access Control (RBAC)

| Role | Module Access |
|------|--------------|
| **Admin** | All modules — system config, user mgmt, audit logs |
| **Management** | Analytics & reporting dashboards |
| **Receptionist** | Patient registration, scheduling, queues |
| **Doctor** | EMR, clinical notes, prescriptions, lab orders |
| **Nurse** | Triage, vitals capture, ward management |
| **Pharmacist** | Prescription dispensing, inventory management |
| **Biller** | Invoice generation, payment processing, insurance |
| **Patient** | Health summary, appointments, prescriptions (portal) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** 15+ (or Supabase account)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret
npm install
npm run dev
```

The API server starts on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The web app starts on `http://localhost:5173`.

### Database Setup

Run the migration files in order against your PostgreSQL database:

```bash
psql -U your_user -d hannah_hms -f backend/database/migrations/001_rbac_users.sql
psql -U your_user -d hannah_hms -f backend/database/migrations/002_patients.sql
psql -U your_user -d hannah_hms -f backend/database/migrations/003_appointments.sql
psql -U your_user -d hannah_hms -f backend/database/migrations/004_emr_encounters.sql
psql -U your_user -d hannah_hms -f backend/database/migrations/005_pharmacy_inventory.sql
psql -U your_user -d hannah_hms -f backend/database/migrations/006_billing.sql
psql -U your_user -d hannah_hms -f backend/database/migrations/007_audit_log.sql
```

### Default Admin Credentials

After running migrations, register the first admin user via the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hannahhms.com","password":"Admin@123","firstName":"System","lastName":"Admin","role":"Admin"}'
```

---

## 📁 Project Structure

```
hannah-hms/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, JWT, environment configs
│   │   ├── middleware/      # Auth, RBAC, audit, error handling
│   │   ├── modules/         # Domain-driven modules
│   │   │   ├── auth/        # Login, register, profile
│   │   │   ├── patient/     # Registration, profiles
│   │   │   ├── appointment/ # Scheduling, check-in
│   │   │   ├── emr/         # Encounters, diagnoses, SOAP
│   │   │   ├── pharmacy/    # Inventory, dispensing
│   │   │   ├── billing/     # Invoices, payments
│   │   │   └── admin/       # User mgmt, audit logs
│   │   ├── utils/           # MRN generator, response helpers
│   │   └── server.ts        # Express entry point
│   └── database/migrations/ # PostgreSQL DDL scripts
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptor
│   │   ├── components/      # UI primitives + shared components
│   │   ├── context/         # Auth context (role state)
│   │   ├── pages/           # Role-specific dashboard pages
│   │   ├── routes/          # Protected route guards
│   │   └── types/           # Shared TypeScript interfaces
│   └── index.html
│
└── README.md
```

---

## 🔒 Compliance & Security

- **HIPAA:** TLS encryption in transit, AES-256 at rest, PHI audit trails
- **GDPR:** PII separation, data archiving workflows
- **HL7/FHIR:** Clinical data structures mapped to FHIR naming conventions
- **Audit Logging:** Every PHI access is recorded with user, timestamp, IP, and action

---

## 📋 Operational Workflow

```
Patient Walk-in → Receptionist (Registration & Check-in)
                        ↓
                  Nurse (Vitals & Triage)
                        ↓
                  Doctor (SOAP Notes & Rx)
                        ↓
              ┌─────────┴──────────┐
              ↓                    ↓
    Pharmacist (Dispense)   Biller (Invoice)
```

---

## 📄 License

Copyright © 2026 Hannah HMS. All rights reserved.
