import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as invoiceService from './invoice.service';

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    successResponse(res, invoice, 'Invoice created.', 201);
  } catch (error) { next(error); }
};

export const getAll = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await invoiceService.getAllInvoices({
      status: req.query.status as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    successResponse(res, result);
  } catch (error) { next(error); }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id as string);
    successResponse(res, invoice);
  } catch (error) { next(error); }
};

export const getPatientInvoices = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoices = await invoiceService.getPatientInvoices(req.params.patientId as string);
    successResponse(res, invoices);
  } catch (error) { next(error); }
};

export const recordPayment = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await invoiceService.recordPayment(req.params.id as string, req.body);
    successResponse(res, invoice, 'Payment recorded.');
  } catch (error) { next(error); }
};

export const cancel = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await invoiceService.cancelInvoice(req.params.id as string);
    successResponse(res, invoice, 'Invoice cancelled.');
  } catch (error) { next(error); }
};

export const returnInvoice = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await invoiceService.returnInvoice(req.params.id as string);
    successResponse(res, invoice, 'Invoice returned.');
  } catch (error) { next(error); }
};

export const updateStatus = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, paymentMethod } = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(req.params.id as string, status, paymentMethod);
    successResponse(res, invoice, 'Invoice payment status updated.');
  } catch (error) { next(error); }
};
