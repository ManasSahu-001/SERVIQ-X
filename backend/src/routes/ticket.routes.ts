import { Router } from 'express';
import { z } from 'zod';
import { ticketController } from '../controllers/ticket.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireTenant, requireAdmin } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

const createTicketSchema = z.object({
  title: z.string().optional(),
  subject: z.string().optional(),
  category: z
    .enum(['Billing', 'Payment', 'Refund', 'Shipping', 'Technical Support', 'Product Inquiry', 'General'])
    .optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  conversationId: z.string().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  assigned_to: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  category: z
    .enum(['Billing', 'Payment', 'Refund', 'Shipping', 'Technical Support', 'Product Inquiry', 'General'])
    .optional(),
});

router.use(authenticateToken, requireTenant, requireAdmin);

router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', validate({ body: createTicketSchema }), ticketController.createTicket);
router.patch('/:id', validate({ body: updateTicketSchema }), ticketController.updateTicket);

export default router;
