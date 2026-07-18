import { Router } from 'express';
import * as dController from './diagnostics.controller';
import { authenticateJWT } from '../../middleware/authenticate';

const router = Router();

router.get('/reports/public/:itemId', dController.getPublicReport);

router.use(authenticateJWT);

router.get('/dashboard/stats', dController.getDashboardStats);
router.get('/categories', dController.getCategories);

router.get('/services', dController.getServices);
router.post('/services', dController.addService);
router.put('/services/:id', dController.editService);
router.delete('/services/:id', dController.deleteService);

router.get('/packages', dController.getPackages);
router.post('/packages', dController.addPackage);

router.get('/orders', dController.getOrders);
router.post('/orders', dController.createOrder);
router.post('/orders/:id/pay', dController.payOrder);

router.post('/samples/collect', dController.collectSample);
router.post('/results/submit', dController.submitResult);
router.post('/results/verify', dController.verifyReport);

router.get('/machines', dController.getMachines);
router.post('/machines', dController.addMachine);

router.get('/referrals', dController.getReferrals);
router.post('/referrals', dController.addReferral);

router.get('/qc', dController.getQcLogs);
router.post('/qc', dController.addQcLog);

router.put('/orders/items/:itemId/status', dController.updateOrderItemStatus);

export default router;
