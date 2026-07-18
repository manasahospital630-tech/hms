import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email({ message: 'A valid email address is required' })
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128)
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  firstName: z.string().min(1, { message: 'First name is required' }).max(100).trim(),
  lastName: z.string().min(1, { message: 'Last name is required' }).max(100).trim(),
  phone: z.string().max(20).optional(),
  role: z.enum(['Admin', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Patient', 'Incharge'], {
    errorMap: () => ({ message: 'Invalid role. Must be one of: Admin, Management, Doctor, Nurse, Receptionist, Pharmacist, Biller, Patient, Incharge' }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'A valid email address is required' })
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
