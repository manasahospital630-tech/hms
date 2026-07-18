import { Router } from 'express';
import * as ctrl from './appointment.controller';
import { validate } from '../../middleware/validator';
import { createAppointmentSchema, updateAppointmentStatusSchema, createOPCheckInSchema } from './appointment.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.post('/', authenticateJWT, enforceRBAC(['Receptionist', 'Admin', 'Patient']), validate(createAppointmentSchema), auditLogger('CREATE', 'Appointment'), ctrl.create);
router.get('/', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.getAll);
router.get('/check-review', authenticateJWT, enforceRBAC(['Receptionist', 'Admin', 'Biller']), ctrl.checkReviewStatus);
router.post('/op-checkin', authenticateJWT, enforceRBAC(['Receptionist', 'Admin', 'Biller']), validate(createOPCheckInSchema), auditLogger('CREATE', 'OPCheckIn'), ctrl.createOPCheckIn);
router.get('/:id', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.getById);
router.patch('/:id/status', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin']), validate(updateAppointmentStatusSchema), auditLogger('STATUS_UPDATE', 'Appointment'), ctrl.updateStatus);

export default router;
