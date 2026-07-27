import { Request, Response, NextFunction } from 'express';
import * as rbacService from './rbac.service';
import { successResponse, errorResponse } from '../../utils/responseHelper';

export const getModulesMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modules = await rbacService.getModulesMaster();
    successResponse(res, modules);
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await rbacService.getRoles();
    successResponse(res, roles);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roleId = req.params.id as string;
    const role = await rbacService.getRoleById(roleId);
    if (!role) {
      errorResponse(res, 'Role not found', 404);
      return;
    }
    successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role_name, description, permissions } = req.body;
    if (!role_name || !role_name.trim()) {
      errorResponse(res, 'Role name is required', 400);
      return;
    }
    const role = await rbacService.createRole({ role_name, description, permissions });
    successResponse(res, role, 'Role created successfully', 201);
  } catch (error: any) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roleId = req.params.id as string;
    const { role_name, description, permissions } = req.body;
    const role = await rbacService.updateRole(roleId, { role_name, description, permissions });
    successResponse(res, role, 'Role updated successfully');
  } catch (error: any) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roleId = req.params.id as string;
    const result = await rbacService.deleteRole(roleId);
    successResponse(res, result, 'Role deleted successfully');
  } catch (error: any) {
    errorResponse(res, error.message || 'Failed to delete role', 400);
  }
};
