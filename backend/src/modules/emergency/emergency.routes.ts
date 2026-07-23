import { Router } from 'express';
import * as emergencyCtrl from './emergency.controller';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

// Admit an emergency patient
router.post('/admit', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin', 'Receptionist', 'Incharge']), auditLogger('ADMIT_EMERGENCY', 'EmergencyPatient'), emergencyCtrl.admitEmergencyPatient);

// Submit police intimation details
router.post('/mlc-police-intimation', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin', 'Incharge']), auditLogger('MLC_POLICE_INTIMATION', 'EmergencyPatient'), emergencyCtrl.generatePoliceIntimation);

// Fetch consents for an emergency record
router.get('/consents/:emergencyId', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin', 'Incharge']), emergencyCtrl.getEmergencyConsents);

// Capture/sign digital consent
router.post('/consents/sign', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin', 'Incharge']), auditLogger('SIGN_CONSENT', 'EmergencyPatient'), emergencyCtrl.saveDigitalConsent);

// Log vital signs
router.post('/vitals/log', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), auditLogger('LOG_EMERGENCY_VITALS', 'EmergencyPatient'), emergencyCtrl.logEmergencyVitals);

// Fetch vitals history for an emergency record
router.get('/vitals/history/:emergencyId', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), emergencyCtrl.getEmergencyVitalsHistory);

// Update patient status in ER
router.put('/status-update', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin', 'Incharge']), auditLogger('UPDATE_EMERGENCY_STATUS', 'EmergencyPatient'), emergencyCtrl.updateEmergencyStatus);

// Create doctor emergency/STAT order
router.post('/orders', authenticateJWT, enforceRBAC(['Doctor', 'Admin']), auditLogger('CREATE_EMERGENCY_ORDER', 'EmergencyPatient'), emergencyCtrl.createEmergencyOrder);

// Fetch emergency/STAT orders
router.get('/orders/:emergencyId', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), emergencyCtrl.getEmergencyOrders);

// Update status of STAT order
router.patch('/orders/:orderId/status', authenticateJWT, enforceRBAC(['Nurse', 'Doctor', 'Admin']), auditLogger('UPDATE_EMERGENCY_ORDER_STATUS', 'EmergencyPatient'), emergencyCtrl.updateEmergencyOrderStatus);

// Fetch active emergency room patients list
router.get('/active-patients', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin', 'Receptionist', 'Incharge']), emergencyCtrl.getActiveEmergencyPatients);

export default router;
