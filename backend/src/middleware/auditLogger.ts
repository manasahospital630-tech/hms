import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { ProtectedRequest } from './rbacHandler';

export const auditLogger = (action: string, resourceType: string) => {
  return async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Capture the original json method to intercept the response
    const originalJson = res.json.bind(res);
    
    res.json = (body: any) => {
      // Only log on successful operations
      if (body && body.success) {
        const userId = req.identity?.userId || null;
        const resourceId = req.params.id || body?.data?.user_id || body?.data?.patient_id || body?.data?.appointment_id || body?.data?.encounter_id || body?.data?.invoice_id || body?.data?.prescription_id || body?.data?.item_id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        // Build details object with relevant request info
        const details: Record<string, any> = {};
        if (req.method !== 'GET') {
          details.method = req.method;
          details.path = req.originalUrl;
          // Exclude sensitive fields from the logged body
          if (req.body) {
            const sanitizedBody = { ...req.body };
            delete sanitizedBody.password;
            delete sanitizedBody.password_hash;
            details.body = sanitizedBody;
          }
        }

        // Fire-and-forget audit log insert — do not block the response
        query(
          `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
        ).catch((err) => {
          console.error('Audit log insert failed:', err.message);
        });
      }

      return originalJson(body);
    };

    next();
  };
};
