import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse, errorResponse } from '../../utils/responseHelper';
import * as patientService from './patient.service';

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.createPatient(req.body);
    successResponse(res, patient, 'Patient registered successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, limit, offset } = req.query;
    const result = await patientService.getPatients({
      search: search as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.getPatientById(req.params.id as string);
    successResponse(res, patient);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.updatePatient(req.params.id as string, req.body);
    successResponse(res, patient, 'Patient updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const givePortalAccess = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await patientService.givePortalAccess(req.params.id as string);
    successResponse(res, result, 'Patient portal access granted successfully.', 200);
  } catch (error) {
    next(error);
  }
};

