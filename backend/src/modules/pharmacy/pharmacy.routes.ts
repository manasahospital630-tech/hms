import { Router } from 'express';
import * as inventoryCtrl from './inventory.controller';
import * as prescriptionCtrl from './prescription.controller';
import { validate } from '../../middleware/validator';
import { createInventoryItemSchema, updateInventoryItemSchema, createPrescriptionSchema, createSaleSchema } from './pharmacy.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

// Inventory
router.get('/inventory', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin', 'Doctor']), inventoryCtrl.getAll);
router.get('/inventory/low-stock', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), inventoryCtrl.getLowStock);
router.get('/inventory/:id', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), inventoryCtrl.getById);
router.post('/inventory', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), validate(createInventoryItemSchema), auditLogger('CREATE', 'InventoryItem'), inventoryCtrl.create);
router.put('/inventory/:id', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), validate(updateInventoryItemSchema), auditLogger('UPDATE', 'InventoryItem'), inventoryCtrl.update);
router.post('/sales', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), validate(createSaleSchema), auditLogger('CREATE', 'Invoice'), inventoryCtrl.createSale);
router.get('/sales', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), inventoryCtrl.getSalesHistory);

// Prescriptions
router.get('/prescriptions/pending', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), prescriptionCtrl.getPending);
router.get('/prescriptions/:id', authenticateJWT, enforceRBAC(['Pharmacist', 'Doctor', 'Admin']), prescriptionCtrl.getById);
router.post('/prescriptions', authenticateJWT, enforceRBAC(['Doctor', 'Admin']), validate(createPrescriptionSchema), auditLogger('CREATE', 'Prescription'), prescriptionCtrl.create);
router.patch('/prescriptions/:id/dispense', authenticateJWT, enforceRBAC(['Pharmacist', 'Admin']), auditLogger('DISPENSE', 'Prescription'), prescriptionCtrl.dispense);

export default router;
