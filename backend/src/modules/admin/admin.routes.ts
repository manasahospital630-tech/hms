import { Router } from 'express';
import * as ctrl from './admin.controller';
import { validate } from '../../middleware/validator';
import { createUserSchema, updateUserSchema, upsertDoctorProfileSchema } from './admin.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.get('/users', authenticateJWT, enforceRBAC(['Admin']), ctrl.getUsers);
router.post('/users', authenticateJWT, enforceRBAC(['Admin']), validate(createUserSchema), auditLogger('CREATE', 'User'), ctrl.createUser);
router.patch('/users/:id', authenticateJWT, enforceRBAC(['Admin']), validate(updateUserSchema), auditLogger('UPDATE', 'User'), ctrl.updateUser);
router.get('/audit-log', authenticateJWT, enforceRBAC(['Admin']), ctrl.getAuditLog);
router.get('/dashboard-stats', authenticateJWT, enforceRBAC(['Admin', 'Management']), ctrl.getDashboardStats);

router.get('/doctor-profiles', authenticateJWT, enforceRBAC(['Admin', 'Biller']), ctrl.getDoctorProfiles);
router.post('/doctor-profiles', authenticateJWT, enforceRBAC(['Admin', 'Biller']), validate(upsertDoctorProfileSchema), auditLogger('UPDATE', 'DoctorProfile'), ctrl.upsertDoctorProfile);

router.get('/hospital-settings/public', ctrl.getHospitalSettingsPublic);
router.get('/hospital-settings', authenticateJWT, enforceRBAC(['Admin', 'Receptionist', 'Biller', 'Pharmacist']), ctrl.getHospitalSettings);
router.put('/hospital-settings', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'HospitalSettings'), ctrl.updateHospitalSettings);

// Route registrations completed
export default router;
