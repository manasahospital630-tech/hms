/* ============================================================
   Hannah HMS — TypeScript Interfaces & Types
   ============================================================ */

export type UserRole =
  | 'Admin'
  | 'Management'
  | 'Doctor'
  | 'Nurse'
  | 'Receptionist'
  | 'Pharmacist'
  | 'Biller'
  | 'Patient'
  | 'Incharge';

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
}

export interface Patient {
  patientId: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies: string;
  createdAt: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'CheckedIn'
  | 'InConsultation'
  | 'Completed'
  | 'Cancelled';

export interface Appointment {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  symptomsBrief: string;
  notes: string;
  patientName?: string;
  doctorName?: string;
}

export interface Encounter {
  encounterId: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  encounterTimestamp: string;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulseRate: number | null;
  temperatureCelsius: number | null;
  weightKg: number | null;
  heightCm: number | null;
  spo2: number | null;
  chiefComplaint: string;
  soapSubjective: string;
  soapObjective: string;
  soapAssessment: string;
  soapPlan: string;
  status: string;
  diagnoses?: Diagnosis[];
}

export interface Diagnosis {
  diagnosisId: string;
  encounterId: string;
  icdCode: string;
  description: string;
  isPrimary: boolean;
}

export interface InventoryItem {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  manufacturer: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string;
}

export interface Prescription {
  prescriptionId: string;
  encounterId: string;
  doctorId: string;
  patientId: string;
  issuedAt: string;
  status: string;
  dispensedBy: string | null;
  dispensedAt: string | null;
  items?: PrescriptionItem[];
  patientName?: string;
  doctorName?: string;
}

export interface PrescriptionItem {
  prescriptionItemId: string;
  prescriptionId: string;
  itemId: string;
  dosageInstruction: string;
  quantityPrescribed: number;
  itemName?: string;
}

export type InvoiceStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'WrittenOff';

export interface Invoice {
  invoiceId: string;
  patientId: string;
  encounterId: string;
  totalAmount: number;
  discount: number;
  tax: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  items?: InvoiceItem[];
  patientName?: string;
}

export interface InvoiceItem {
  invoiceItemId: string;
  invoiceId: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
