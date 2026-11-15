import { Router } from 'express';
import { z } from 'zod';
import { userController } from '../controllers/user.controller.js';
import { conversationController } from '../controllers/conversation.controller.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

const requestHumanSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  reason: z.string().optional(),
  actionType: z.string().optional(),
});

router.use(optionalAuthenticate);

// Customer conversation list & details
router.get('/conversations', userController.getCustomerConversations);
router.get('/conversations/:id', userController.getCustomerConversationById);

// Submit human assistance or verification request
router.post(
  '/request-human',
  validate({ body: requestHumanSchema }),
  userController.requestHumanAssistance
);

// Customer Chat Query
router.post('/chat', chatRateLimiter, conversationController.chat);

export default router;
