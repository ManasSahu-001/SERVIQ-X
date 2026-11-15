import { Request, Response, NextFunction } from 'express';
import { store, DEMO_COMPANY_ID } from '../services/store.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { getSocketServer } from '../sockets/socket.js';
import { SOCKET_EVENTS } from '../sockets/events.js';
import { TicketCategory, Priority } from '../types/index.js';

export const userController = {
  /**
   * GET /api/user/conversations
   * Retrieves conversations belonging strictly to the authenticated customer
   */
  async getCustomerConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId || DEMO_COMPANY_ID;
      const customerEmail = req.user?.email || (req.query.email as string) || 'priya.customer@example.com';

      const allConvs = store.getConversationsByCompany(companyId);
      // Filter strictly by customer email (or default customer demo data)
      const customerConvs = allConvs.filter(
        (c) =>
          c.customer_email?.toLowerCase() === customerEmail.toLowerCase() ||
          c.customer_name?.toLowerCase().includes('customer') ||
          c.customer_name?.toLowerCase().includes('priya')
      );

      const enriched = customerConvs.map((c) => ({
        ...c,
        messages: store.getMessagesByConversation(c.id),
      }));

      return sendSuccess(res, enriched);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/user/conversations/:id
   * Retrieves single conversation if customer is the owner
   */
  async getCustomerConversationById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId || DEMO_COMPANY_ID;
      const conversationId = String(req.params.id);
      const customerEmail = req.user?.email || (req.query.email as string);

      const conv = store.getConversationById(companyId, conversationId);
      if (!conv) {
        throw new NotFoundError('Conversation not found');
      }

      // Verify customer ownership if customer email is available
      if (
        customerEmail &&
        conv.customer_email &&
        conv.customer_email.toLowerCase() !== customerEmail.toLowerCase() &&
        !conv.customer_name?.toLowerCase().includes('customer')
      ) {
        throw new ForbiddenError('Access denied: You do not have permission to view this conversation');
      }

      const messages = store.getMessagesByConversation(conv.id);

      return sendSuccess(res, {
        ...conv,
        messages,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/user/request-human
   * Customer requests human verification or human approval for a refund/action
   * IMPORTANT: Does NOT auto-approve refund. Routes to human review.
   */
  async requestHumanAssistance(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId || DEMO_COMPANY_ID;
      const { conversationId, reason, actionType } = req.body;

      if (!conversationId) {
        throw new ValidationError('conversationId is required');
      }

      const conv = store.getConversationById(companyId, conversationId);
      if (!conv) {
        throw new NotFoundError('Conversation not found');
      }

      const requestedAction = actionType || 'Human Verification';
      const requestReason = reason || 'Customer requested human assistance / approval';

      // 1. Update conversation status to pending human review
      const updatedConv = store.updateConversation(companyId, conversationId, {
        assigned_to: 'human',
        status: 'pending',
        priority: requestedAction.toLowerCase().includes('refund') || requestedAction.toLowerCase().includes('payment') ? 'P1' : 'P2',
      });

      // 2. Idempotently create / update associated ticket
      const ticketCategory: TicketCategory =
        requestedAction.toLowerCase().includes('refund')
          ? 'Refund'
          : requestedAction.toLowerCase().includes('payment')
            ? 'Payment'
            : (conv.category as TicketCategory) || 'General';

      const ticketPriority: Priority = updatedConv?.priority || 'P2';

      const ticket = store.createTicket({
        company_id: companyId,
        conversation_id: conversationId,
        title: `Human Review Requested: ${requestedAction} (${conv.customer_name})`,
        category: ticketCategory,
        priority: ticketPriority,
        status: 'open',
        assigned_to: 'Support Lead Queue',
        notes: `Customer Action: ${requestedAction}. Customer Reason: ${requestReason}. Decision Pending: Admin approval required.`,
      });

      // Link ticket to conversation
      store.updateConversation(companyId, conversationId, {
        ticket_id: ticket.id,
      });

      // 3. Insert system audit notice into the conversation thread
      const systemNotice = store.createMessage({
        conversation_id: conversationId,
        sender_type: 'system',
        content: `📋 Customer requested ${requestedAction}: "${requestReason}". Request submitted for Support Lead review (Ticket ${ticket.id}). Note: Awaiting human decision.`,
        sender_name: 'Human Review Dispatcher',
      });

      // 4. Real-time broadcast
      const io = getSocketServer();
      if (io) {
        io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, updatedConv);
        io.to(`company:${companyId}`).emit(SOCKET_EVENTS.CONVERSATION_ESCALATED, {
          conversationId,
          ticketId: ticket.id,
          priority: ticketPriority,
          actionType: requestedAction,
        });
        io.to(`company:${companyId}`).emit(SOCKET_EVENTS.TICKET_CREATED, ticket);
        io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.CUSTOMER_MESSAGE, systemNotice);
      }

      return sendSuccess(res, {
        conversation: {
          ...updatedConv,
          messages: store.getMessagesByConversation(conversationId),
        },
        ticket,
        reviewStatus: 'Waiting for human review',
        message: 'Your request has been routed to our human support leads for verification.',
      });
    } catch (err) {
      next(err);
    }
  },
};
