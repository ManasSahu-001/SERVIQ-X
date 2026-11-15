import { Router } from 'express';
import { z } from 'zod';
import { companyController } from '../controllers/company.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
});

router.post(
  '/',
  authenticateToken,
  validate({ body: createCompanySchema }),
  companyController.createCompany
);

router.get('/me', authenticateToken, companyController.getMyCompany);

export default router;
