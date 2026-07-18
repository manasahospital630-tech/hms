import { Request, Response, NextFunction } from 'express';

export type UserRole = 'Admin' | 'Management' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Biller' | 'Patient' | 'Incharge';

export interface IdentityPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface ProtectedRequest extends Request {
  identity?: IdentityPayload;
}

export const enforceRBAC = (allowedRoles: UserRole[]) => {
  return (req: ProtectedRequest, res: Response, next: NextFunction): void => {
    if (!req.identity) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. No identity found on request.',
      });
      return;
    }

    if (!allowedRoles.includes(req.identity.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Your role '${req.identity.role}' is not authorized for this resource. Required roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
};
