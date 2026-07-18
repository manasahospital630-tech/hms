import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["Admin", "Management", "Doctor", "Nurse", "Receptionist", "Pharmacist", "Biller", "Patient", "Incharge"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "Admin" | "Management" | "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Biller" | "Patient" | "Incharge";
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "Admin" | "Management" | "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Biller" | "Patient" | "Incharge";
    phone?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<["Admin", "Management", "Doctor", "Nurse", "Receptionist", "Pharmacist", "Biller", "Patient", "Incharge"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    role?: "Admin" | "Management" | "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Biller" | "Patient" | "Incharge" | undefined;
    isActive?: boolean | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    role?: "Admin" | "Management" | "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Biller" | "Patient" | "Incharge" | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export declare const upsertDoctorProfileSchema: z.ZodObject<{
    doctorId: z.ZodString;
    department: z.ZodString;
    consultationFee: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    doctorId: string;
    department: string;
    consultationFee: number;
}, {
    doctorId: string;
    department: string;
    consultationFee: number;
}>;
export type UpsertDoctorProfileInput = z.infer<typeof upsertDoctorProfileSchema>;
//# sourceMappingURL=admin.schema.d.ts.map