"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDoctorProfileSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255).transform((val) => val.toLowerCase().trim()),
    password: zod_1.z.string().min(8).max(128),
    firstName: zod_1.z.string().min(1).max(100).trim(),
    lastName: zod_1.z.string().min(1).max(100).trim(),
    phone: zod_1.z.string().max(20).optional(),
    role: zod_1.z.enum(['Admin', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Patient', 'Incharge']),
});
exports.updateUserSchema = zod_1.z.object({
    role: zod_1.z.enum(['Admin', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Patient', 'Incharge']).optional(),
    isActive: zod_1.z.boolean().optional(),
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    phone: zod_1.z.string().max(20).optional(),
});
exports.upsertDoctorProfileSchema = zod_1.z.object({
    doctorId: zod_1.z.string().uuid(),
    department: zod_1.z.string().min(1).max(100),
    consultationFee: zod_1.z.number().min(0),
});
//# sourceMappingURL=admin.schema.js.map