import { Router } from 'express';
import { z } from 'zod';
import { conversationController } from '../controllers/conversation.controller.js';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { requireTenant, requireAdmin } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

const createConversationSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

const messageSchema = z.object({
  text: z.string().optional(),
  content: z.string().optional(),
  sender: z.enum(['customer', 'ai', 'agent']).optional(),
  senderName: z.string().optional(),
});

const takeoverSchema = z.object({
  agentName: z.string().optional(),
});

// Customer can start conversation or authenticated agent can create one
router.post(
  '/',
  optionalAuthenticate,
  validate({ body: createConversationSchema }),
  conversationController.createConversation
);

// Protected agent / tenant operations
router.get('/', authenticateToken, requireTenant, conversationController.getConversations);
router.get('/:id', authenticateToken, requireTenant, conversationController.getConversationById);

// Add message
router.post(
  '/:id/messages',
  authenticateToken,
  requireTenant,
  validate({ body: messageSchema }),
  conversationController.addMessage
);

// Concurrency-safe takeover and handback (Admin/Agent only)
router.post(
  '/:id/takeover',
  authenticateToken,
  requireTenant,
  requireAdmin,
  validate({ body: takeoverSchema }),
  conversationController.takeover
);

router.post(
  '/:id/handback',
  authenticateToken,
  requireTenant,
  requireAdmin,
  conversationController.handback
);

export default router;
