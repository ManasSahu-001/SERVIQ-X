import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service.js';
import { sendSuccess } from '../utils/response.js';

export const ticketController = {
  async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const tickets = await ticketService.getTickets(companyId);
      return sendSuccess(res, tickets);
    } catch (err) {
      next(err);
    }
  },

  async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const ticket = await ticketService.getTicketById(companyId, String(req.params.id));
      return sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  },

  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { title, subject, category, priority, assignedTo, notes, conversationId } = req.body;

      const ticket = await ticketService.createTicket({
        companyId,
        conversationId,
        title: title || subject || 'Support Ticket',
        category,
        priority,
        assignedTo,
        notes,
      });

      return sendSuccess(res, ticket, 'Ticket created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const ticketId = String(req.params.id);
      const updates = req.body;

      const updated = await ticketService.updateTicket(companyId, ticketId, updates);
      return sendSuccess(res, updated, 'Ticket updated successfully');
    } catch (err) {
      next(err);
    }
  },
};
