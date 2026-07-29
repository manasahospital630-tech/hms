import { z } from 'zod';
export declare const createInvoiceSchema: z.ZodObject<{
    patientId: z.ZodString;
    encounterId: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        category: string;
        unitPrice: number;
        quantity: number;
    }, {
        description: string;
        unitPrice: number;
        quantity: number;
        category?: string | undefined;
    }>, "many">;
    discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    insuranceCoverage: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodString>;
    paidAmount: z.ZodOptional<z.ZodNumber>;
    amountPaid: z.ZodOptional<z.ZodNumber>;
    dueAmount: z.ZodOptional<z.ZodNumber>;
    paymentStatus: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    items: {
        description: string;
        category: string;
        unitPrice: number;
        quantity: number;
    }[];
    discount: number;
    tax: number;
    insuranceCoverage: number;
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    encounterId?: string | undefined;
    paidAmount?: number | undefined;
    amountPaid?: number | undefined;
    dueAmount?: number | undefined;
    paymentStatus?: string | undefined;
}, {
    patientId: string;
    items: {
        description: string;
        unitPrice: number;
        quantity: number;
        category?: string | undefined;
    }[];
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    encounterId?: string | undefined;
    discount?: number | undefined;
    tax?: number | undefined;
    insuranceCoverage?: number | undefined;
    paidAmount?: number | undefined;
    amountPaid?: number | undefined;
    dueAmount?: number | undefined;
    paymentStatus?: string | undefined;
}>;
export declare const recordPaymentSchema: z.ZodObject<{
    amountPaid: z.ZodNumber;
    paymentMethod: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paymentMethod: string;
    amountPaid: number;
}, {
    paymentMethod: string;
    amountPaid: number;
}>;
export declare const collectDueSchema: z.ZodObject<{
    collectAmount: z.ZodNumber;
    paymentMode: z.ZodString;
    paymentTimestamp: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    transactionRef: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    collectAmount: number;
    paymentMode: string;
    notes?: string | undefined;
    paymentTimestamp?: string | undefined;
    transactionRef?: string | undefined;
}, {
    collectAmount: number;
    paymentMode: string;
    notes?: string | undefined;
    paymentTimestamp?: string | undefined;
    transactionRef?: string | undefined;
}>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CollectDueInput = z.infer<typeof collectDueSchema>;
//# sourceMappingURL=billing.schema.d.ts.map