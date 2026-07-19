"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ctrl = __importStar(require("./admin.controller"));
const validator_1 = require("../../middleware/validator");
const admin_schema_1 = require("./admin.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
router.get('/users', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), ctrl.getUsers);
router.post('/users', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, validator_1.validate)(admin_schema_1.createUserSchema), (0, auditLogger_1.auditLogger)('CREATE', 'User'), ctrl.createUser);
router.patch('/users/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, validator_1.validate)(admin_schema_1.updateUserSchema), (0, auditLogger_1.auditLogger)('UPDATE', 'User'), ctrl.updateUser);
router.get('/audit-log', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), ctrl.getAuditLog);
router.get('/dashboard-stats', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Management']), ctrl.getDashboardStats);
router.get('/doctor-profiles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Biller']), ctrl.getDoctorProfiles);
router.post('/doctor-profiles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Biller']), (0, validator_1.validate)(admin_schema_1.upsertDoctorProfileSchema), (0, auditLogger_1.auditLogger)('UPDATE', 'DoctorProfile'), ctrl.upsertDoctorProfile);
router.get('/hospital-settings/public', ctrl.getHospitalSettingsPublic);
router.get('/hospital-settings', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Receptionist', 'Biller', 'Pharmacist']), ctrl.getHospitalSettings);
router.put('/hospital-settings', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'HospitalSettings'), ctrl.updateHospitalSettings);
// Route registrations completed
exports.default = router;
//# sourceMappingURL=admin.routes.js.map