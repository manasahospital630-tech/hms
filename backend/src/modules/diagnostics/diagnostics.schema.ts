import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().uuid(),
  serviceCode: z.string().min(1),
  price: z.number().positive(),
  gstPercentage: z.number().nonnegative().default(18.00),
  durationMinutes: z.number().positive().default(30),
  sampleRequired: z.string().optional(),
  normalRange: z.string().optional(),
  machineRequired: z.string().optional(),
  homeCollectionAvailable: z.boolean().default(false),
  emergencyAvailable: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const packageSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  discount: z.number().nonnegative().default(0),
  validityDays: z.number().positive().default(365),
  services: z.array(z.string().uuid()).min(1)
});

export const orderSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  referralId: z.string().uuid().optional().nullable(),
  priority: z.enum(['Routine', 'Urgent', 'Emergency']).default('Routine'),
  clinicalNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  services: z.array(z.string().uuid()).min(1),
  packages: z.array(z.string().uuid()).optional()
});

export const sampleCollectionSchema = z.object({
  itemId: z.string().uuid(),
  containerType: z.string().min(1),
  barcode: z.string().min(1),
  remarks: z.string().optional()
});

export const labResultSchema = z.object({
  itemId: z.string().uuid(),
  actualResult: z.string().min(1),
  referenceRange: z.string().optional(),
  status: z.enum(['Normal', 'Low', 'High', 'Critical']).default('Normal'),
  machineReading: z.string().optional(),
  remarks: z.string().optional(),
  machineId: z.string().uuid().optional().nullable()
});

export const radiologyReportSchema = z.object({
  itemId: z.string().uuid(),
  imageUrls: z.array(z.string()).optional(),
  findings: z.string().min(1),
  impression: z.string().min(1),
  conclusion: z.string().optional(),
  radiographerId: z.string().uuid().optional(),
  radiologistId: z.string().uuid().optional()
});

export const ultrasoundReportSchema = z.object({
  itemId: z.string().uuid(),
  clinicalHistory: z.string().optional(),
  findings: z.string().min(1),
  impression: z.string().min(1),
  recommendations: z.string().optional(),
  sonologistId: z.string().uuid().optional()
});

export const ecgReportSchema = z.object({
  itemId: z.string().uuid(),
  graphUrl: z.string().optional(),
  findings: z.string().min(1),
  interpretation: z.string().min(1),
  recommendation: z.string().optional(),
  operatorId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional()
});

export const reportVerificationSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(['Approved', 'Rejected', 'PendingRetest']),
  notes: z.string().optional(),
  digitalSignatureUsed: z.string().optional()
});

export const machineSchema = z.object({
  name: z.string().min(1),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().min(1),
  calibrationDate: z.string().optional(),
  maintenanceDate: z.string().optional(),
  department: z.string().optional(),
  status: z.string().default('Active')
});

export const referralDoctorSchema = z.object({
  name: z.string().min(1),
  hospital: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100).default(0),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

export const qcLogSchema = z.object({
  machineId: z.string().uuid(),
  qcParameter: z.string().min(1),
  expectedValue: z.string().optional(),
  actualValue: z.string().optional(),
  status: z.enum(['Pass', 'Fail']).default('Pass')
});
