import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireTenant } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticateToken, requireTenant);

router.get('/overview', analyticsController.overview);
router.get('/conversations', analyticsController.conversations);
router.get('/tickets', analyticsController.tickets);

export default router;
