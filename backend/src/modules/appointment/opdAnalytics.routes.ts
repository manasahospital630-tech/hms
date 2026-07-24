import { Router } from 'express';
import { getOpdKpiSummary, getOpdGrowthChart, getFilteredOpdRecords } from './opdAnalytics.controller';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';

const router = Router();

router.get('/kpi-summary', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), getOpdKpiSummary);
router.get('/growth-chart', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), getOpdGrowthChart);
router.get('/records', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), getFilteredOpdRecords);

export default router;
