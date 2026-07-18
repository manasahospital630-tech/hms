import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as encounterService from './encounter.service';

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const encounter = await encounterService.createEncounter(req.identity!.userId, req.body);
    successResponse(res, encounter, 'Encounter created successfully.', 201);
  } catch (error) { next(error); }
};

export const getPatientEncounters = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const encounters = await encounterService.getPatientEncounters(req.params.patientId as string);
    successResponse(res, encounters);
  } catch (error) { next(error); }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const encounter = await encounterService.getEncounterById(req.params.id as string);
    successResponse(res, encounter);
  } catch (error) { next(error); }
};

export const updateVitals = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const encounter = await encounterService.updateEncounterVitals(req.params.id as string, req.body);
    successResponse(res, encounter, 'Vitals updated.');
  } catch (error) { next(error); }
};

export const updateSOAP = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const encounter = await encounterService.updateEncounterSOAP(req.params.id as string, req.body);
    successResponse(res, encounter, 'SOAP notes updated.');
  } catch (error) { next(error); }
};

export const getByIpAdmissionId = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const encounter = await encounterService.getEncounterByIpAdmissionId(req.params.ipAdmissionId as string);
    successResponse(res, encounter);
  } catch (error) { next(error); }
};
