import { z } from 'zod';

export const createEncounterSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  chiefComplaint: z.string().min(1, { message: 'Chief complaint is required' }),
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  pulseRate: z.number().int().optional(),
  temperatureCelsius: z.number().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  spo2: z.number().int().optional(),
  soapSubjective: z.string().optional(),
  soapObjective: z.string().optional(),
  soapAssessment: z.string().optional(),
  soapPlan: z.string().optional(),
});

export const updateVitalsSchema = z.object({
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  pulseRate: z.number().int().optional(),
  temperatureCelsius: z.number().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  spo2: z.number().int().optional(),
  chiefComplaint: z.string().optional(),
});

export const updateSoapSchema = z.object({
  soapSubjective: z.string().optional(),
  soapObjective: z.string().optional(),
  soapAssessment: z.string().optional(),
  soapPlan: z.string().optional(),
});

export const addDiagnosisSchema = z.object({
  icdCode: z.string().min(1, { message: 'ICD code is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  isPrimary: z.boolean().optional().default(false),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type UpdateVitalsInput = z.infer<typeof updateVitalsSchema>;
export type UpdateSoapInput = z.infer<typeof updateSoapSchema>;
export type AddDiagnosisInput = z.infer<typeof addDiagnosisSchema>;
