"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectDueSchema = exports.recordPaymentSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.createInvoiceSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    encounterId: zod_1.z.string().uuid().optional(),
    items: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string().min(1),
        category: zod_1.z.string().optional().default('General'),
        quantity: zod_1.z.number().int().min(1),
        unitPrice: zod_1.z.number().min(0),
    })).min(1),
    discount: zod_1.z.number().min(0).optional().default(0),
    tax: zod_1.z.number().min(0).optional().default(0),
    insuranceCoverage: zod_1.z.number().min(0).optional().default(0),
    notes: zod_1.z.string().optional(),
    paidAmount: zod_1.z.number().min(0).optional(),
    amountPaid: zod_1.z.number().min(0).optional(),
    dueAmount: zod_1.z.number().min(0).optional(),
    paymentStatus: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().optional(),
});
exports.recordPaymentSchema = zod_1.z.object({
    amountPaid: zod_1.z.number().min(0.01, { message: 'Payment amount must be positive' }),
    paymentMethod: zod_1.z.string().min(1, { message: 'Payment method is required' }),
});
exports.collectDueSchema = zod_1.z.object({
    collectAmount: zod_1.z.number().min(0.01, { message: 'Collection amount must be greater than 0' }),
    paymentMode: zod_1.z.string().min(1, { message: 'Payment mode is required' }),
    paymentTimestamp: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    transactionRef: zod_1.z.string().optional(),
});
//# sourceMappingURL=billing.schema.js.map