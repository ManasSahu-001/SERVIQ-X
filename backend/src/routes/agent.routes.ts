import { Router } from 'express';
import { z } from 'zod';
import { agentController } from '../controllers/agent.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireTenant } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

const respondSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

const conversationIdSchema = z.object({
  conversationId: z.string(),
});

router.use(authenticateToken, requireTenant);

router.post('/respond', validate({ body: respondSchema }), agentController.respond);
router.post('/suggest-reply', validate({ body: conversationIdSchema }), agentController.suggestReply);
router.post('/summarize', validate({ body: conversationIdSchema }), agentController.summarize);

export default router;
