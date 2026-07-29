import { z } from 'zod';

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    category: z.string().optional().default('General'),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  insuranceCoverage: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  paidAmount: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
  dueAmount: z.number().min(0).optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  amountPaid: z.number().min(0.01, { message: 'Payment amount must be positive' }),
  paymentMethod: z.string().min(1, { message: 'Payment method is required' }),
});

export const collectDueSchema = z.object({
  collectAmount: z.number().min(0.01, { message: 'Collection amount must be greater than 0' }),
  paymentMode: z.string().min(1, { message: 'Payment mode is required' }),
  paymentTimestamp: z.string().optional(),
  notes: z.string().optional(),
  transactionRef: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CollectDueInput = z.infer<typeof collectDueSchema>;
