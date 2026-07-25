import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as buService from './businessUnits.service';

export const getBusinessUnits = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bus = await buService.getBusinessUnits();
    successResponse(res, bus);
  } catch (error) { next(error); }
};

export const createBusinessUnit = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bu = await buService.createBusinessUnit(req.body);
    successResponse(res, bu, 'Business Unit created successfully.', 201);
  } catch (error) { next(error); }
};

export const updateBusinessUnit = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bu = await buService.updateBusinessUnit(req.params.id as string, req.body);
    successResponse(res, bu, 'Business Unit updated successfully.');
  } catch (error) { next(error); }
};

export const getTeams = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teams = await buService.getTeams();
    successResponse(res, teams);
  } catch (error) { next(error); }
};

export const createTeam = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await buService.createTeam(req.body);
    successResponse(res, team, 'Team created successfully.', 201);
  } catch (error) { next(error); }
};

export const getTeamMembers = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const members = await buService.getTeamMembers(req.params.id as string);
    successResponse(res, members);
  } catch (error) { next(error); }
};

export const updateTeamMembers = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await buService.updateTeamMembers(req.params.id as string, req.body.memberUserIds || []);
    successResponse(res, result, 'Team members updated successfully.');
  } catch (error) { next(error); }
};

export const updateTeamRoles = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await buService.updateTeamRoles(req.params.id as string, req.body.roles || []);
    successResponse(res, result, 'Team security roles updated successfully.');
  } catch (error) { next(error); }
};
