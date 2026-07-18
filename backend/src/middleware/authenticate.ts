import { Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { ProtectedRequest } from './rbacHandler';

export const authenticateJWT = (
  req: ProtectedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.identity = {
      userId: decoded.userId,
      role: decoded.role as any,
      email: decoded.email,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.',
    });
  }
};
