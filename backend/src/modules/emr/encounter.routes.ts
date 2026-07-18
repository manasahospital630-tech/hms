import { Router } from 'express';
import * as encounterCtrl from './encounter.controller';
import * as diagnosisCtrl from './diagnosis.controller';
import { validate } from '../../middleware/validator';
import { createEncounterSchema, updateVitalsSchema, updateSoapSchema, addDiagnosisSchema } from './emr.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.post('/encounters', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), validate(createEncounterSchema), auditLogger('CREATE', 'Encounter'), encounterCtrl.create);
router.get('/patients/:patientId/encounters', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), encounterCtrl.getPatientEncounters);
router.get('/encounters/ip-admission/:ipAdmissionId', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), encounterCtrl.getByIpAdmissionId);
router.get('/encounters/:id', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), encounterCtrl.getById);
router.patch('/encounters/:id/vitals', authenticateJWT, enforceRBAC(['Nurse', 'Doctor', 'Admin']), validate(updateVitalsSchema), auditLogger('UPDATE_VITALS', 'Encounter'), encounterCtrl.updateVitals);
router.patch('/encounters/:id/soap', authenticateJWT, enforceRBAC(['Doctor', 'Admin']), validate(updateSoapSchema), auditLogger('UPDATE_SOAP', 'Encounter'), encounterCtrl.updateSOAP);
router.post('/encounters/:id/diagnoses', authenticateJWT, enforceRBAC(['Doctor', 'Admin']), validate(addDiagnosisSchema), auditLogger('ADD_DIAGNOSIS', 'Diagnosis'), diagnosisCtrl.add);
router.get('/encounters/:id/diagnoses', authenticateJWT, enforceRBAC(['Doctor', 'Nurse', 'Admin']), diagnosisCtrl.getForEncounter);

export default router;
