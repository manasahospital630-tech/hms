import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as prescriptionService from './prescription.service';

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rx = await prescriptionService.createPrescription(req.identity!.userId, req.body);
    successResponse(res, rx, 'Prescription created.', 201);
  } catch (error) { next(error); }
};

export const getPending = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescriptions = await prescriptionService.getPendingPrescriptions();
    successResponse(res, prescriptions);
  } catch (error) { next(error); }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rx = await prescriptionService.getPrescriptionById(req.params.id as string);
    successResponse(res, rx);
  } catch (error) { next(error); }
};

export const dispense = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rx = await prescriptionService.dispensePrescription(req.params.id as string, req.identity!.userId);
    successResponse(res, rx, 'Prescription dispensed successfully.');
  } catch (error) { next(error); }
};
