import { CreateInvoiceInput, RecordPaymentInput } from './billing.schema';
export declare const createInvoice: (input: CreateInvoiceInput) => Promise<any>;
export declare const getInvoiceById: (id: string) => Promise<any>;
export declare const getAllInvoices: (filters: {
    status?: string;
    limit?: number;
    offset?: number;
}) => Promise<{
    invoices: any[];
    total: number;
}>;
export declare const getPatientInvoices: (patientId: string) => Promise<any[]>;
export declare const recordPayment: (id: string, input: RecordPaymentInput) => Promise<any>;
export declare const cancelInvoice: (id: string) => Promise<any>;
export declare const returnInvoice: (id: string) => Promise<any>;
export declare const updateInvoiceStatus: (id: string, status: "Paid" | "Unpaid", paymentMethod: string) => Promise<any>;
//# sourceMappingURL=invoice.service.d.ts.map