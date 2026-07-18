import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validator';
import { registerSchema, loginSchema } from './auth.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.post('/register', validate(registerSchema), auditLogger('REGISTER', 'User'), authController.register);
router.post('/login', validate(loginSchema), auditLogger('LOGIN', 'User'), authController.login);
router.get('/profile', authenticateJWT, authController.getProfile);

export default router;
