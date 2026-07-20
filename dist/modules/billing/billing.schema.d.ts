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
    paymentStatus: z.ZodDefault<z.ZodOptional<z.ZodEnum<["Paid", "Unpaid"]>>>;
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
    paymentStatus: "Paid" | "Unpaid";
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    encounterId?: string | undefined;
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
    paymentStatus?: "Paid" | "Unpaid" | undefined;
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
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
//# sourceMappingURL=billing.schema.d.ts.map