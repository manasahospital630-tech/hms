import { Router } from 'express';
import * as ipController from './ip.controller';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';

const router = Router();

router.use(authenticateJWT);

router.get('/beds', ipController.getBeds);
router.get('/admissions/active', ipController.getActiveAdmissions);

router.post('/admit/routine', enforceRBAC(['Doctor', 'Admin', 'Nurse']), ipController.admitRoutine);
router.post('/admit/emergency', enforceRBAC(['Doctor', 'Admin', 'Nurse']), ipController.admitEmergencyFastTrack);
router.post('/transfer', enforceRBAC(['Doctor', 'Admin', 'Nurse']), ipController.transferBed);
router.post('/discharge/:id', enforceRBAC(['Doctor', 'Admin']), ipController.dischargePatient);

// Bed CRUD operations
router.post('/beds', enforceRBAC(['Admin', 'Incharge']), ipController.addBed);
router.put('/beds/:id', enforceRBAC(['Admin', 'Incharge']), ipController.editBed);
router.delete('/beds/:id', enforceRBAC(['Admin', 'Incharge']), ipController.deleteBed);

export default router;
