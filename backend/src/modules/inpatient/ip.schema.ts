import { z } from 'zod';

export const routineAdmissionSchema = z.object({
  patientId: z.string().uuid(),
  admissionType: z.enum(['Routine_IP', 'Emergency']),
  admittingDoctorId: z.string().uuid(),
  targetBedId: z.string().uuid(),
  reasonForAdmission: z.string().min(5)
});

export const emergencyFastTrackSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  emergencyContact: z.string().optional(),
  admissionType: z.enum(['Emergency']),
  admittingDoctorId: z.string().uuid(),
  targetBedId: z.string().uuid(),
  reasonForAdmission: z.string().min(5),
  chiefComplaint: z.string().min(5)
});

export const transferBedSchema = z.object({
  ipAdmissionId: z.string().uuid(),
  targetBedId: z.string().uuid(),
  transferReason: z.string().min(5)
});

export const bedSchema = z.object({
  bedNumber: z.string().min(1),
  wardName: z.string().min(1),
  type: z.enum(['Emergency', 'ICU', 'General_Ward', 'Semi_Private', 'Private_Suite']),
  status: z.enum(['Available', 'Occupied', 'Maintenance']).default('Available'),
  perDayCharge: z.number().positive(),
  floor: z.string().min(1).default('1st Floor')
});

export type RoutineAdmissionInput = z.infer<typeof routineAdmissionSchema>;
export type EmergencyFastTrackInput = z.infer<typeof emergencyFastTrackSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type BedInput = z.infer<typeof bedSchema>;
