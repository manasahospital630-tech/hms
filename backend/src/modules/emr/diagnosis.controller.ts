import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as diagnosisService from './diagnosis.service';

export const add = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const diagnosis = await diagnosisService.addDiagnosis(req.params.id as string, req.body);
    successResponse(res, diagnosis, 'Diagnosis added.', 201);
  } catch (error) { next(error); }
};

export const getForEncounter = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const diagnoses = await diagnosisService.getEncounterDiagnoses(req.params.id as string);
    successResponse(res, diagnoses);
  } catch (error) { next(error); }
};
