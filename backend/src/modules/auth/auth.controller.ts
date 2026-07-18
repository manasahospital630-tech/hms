import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/responseHelper';
import { ProtectedRequest } from '../../middleware/rbacHandler';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    successResponse(res, user, 'User registered successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);
    successResponse(res, result, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.identity) {
      errorResponse(res, 'Authentication required.', 401);
      return;
    }
    const user = await authService.getUserProfile(req.identity.userId);
    successResponse(res, user, 'Profile retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
