import { z } from 'zod';

export const createPatientSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }).max(100).trim(),
  lastName: z.string().min(1, { message: 'Last name is required' }).max(100).trim(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date of birth is required (YYYY-MM-DD)' }),
  gender: z.string().min(1, { message: 'Gender is required' }).max(20),
  bloodGroup: z.string().max(5).optional(),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  emergencyContactName: z.string().max(150).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  insuranceProvider: z.string().max(200).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  allergies: z.string().optional(),
  userId: z.string().uuid().optional(),
  assignedDoctorId: z.string().uuid().optional().nullable(),
});

export const updatePatientSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date is required' }).optional(),
  gender: z.string().max(20).optional(),
  bloodGroup: z.string().max(5).optional(),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  emergencyContactName: z.string().max(150).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  insuranceProvider: z.string().max(200).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  allergies: z.string().optional(),
  assignedDoctorId: z.string().uuid().optional().nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
