import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().max(255).transform((val) => val.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional(),
  role: z.enum(['Admin', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Patient', 'Incharge']),
});

export const updateUserSchema = z.object({
  role: z.enum(['Admin', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Patient', 'Incharge']).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const upsertDoctorProfileSchema = z.object({
  doctorId: z.string().uuid(),
  department: z.string().min(1).max(100),
  consultationFee: z.number().min(0),
});

export type UpsertDoctorProfileInput = z.infer<typeof upsertDoctorProfileSchema>;

